import { AxiosInstance, AxiosError } from 'axios'
import { store } from '@/store/store'
import { clearSession } from '@/store/slices/authSlice'

let isHandlingUnauthorized = false

const isAuthEndpoint = (url?: string) => {
  if (!url) return false
  return ['/auth/logout', '/auth/me', '/auth/login', '/auth/register', '/auth/refresh'].some((path) =>
    url.includes(path)
  )
}

export const setupInterceptors = (api: AxiosInstance) => {
  api.defaults.withCredentials = true

  api.interceptors.request.use(
    (config) => {
      const state = store.getState()
      const token = state.auth.token
      const activeClubId = state.clubs.activeClub?.id

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      if (activeClubId) {
        config.headers['X-Club-ID'] = activeClubId
      }

      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        const requestUrl = error.config?.url
        const currentPath = window.location.pathname

        if (!isHandlingUnauthorized && !isAuthEndpoint(requestUrl)) {
          isHandlingUnauthorized = true
          store.dispatch(clearSession())

          if (currentPath !== '/login') {
            window.location.href = '/login'
          }

          setTimeout(() => {
            isHandlingUnauthorized = false
          }, 0)
        }
      }

      return Promise.reject(error)
    }
  )
}
