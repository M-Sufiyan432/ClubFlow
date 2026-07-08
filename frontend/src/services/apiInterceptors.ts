import { AxiosInstance, AxiosError } from 'axios'
import { store } from '@/store/store'
import { clearSession, setToken, setUser } from '@/store/slices/authSlice'
import { captureFrontendException, setSentryClub, setSentryUser } from '@/lib/sentry'

const createRequestId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
let refreshPromise: Promise<string | null> | null = null

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
      const requestId = createRequestId()

      config.headers['X-Request-ID'] = requestId
      config.headers['X-Correlation-ID'] = requestId

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      if (activeClubId) {
        config.headers['X-Club-ID'] = activeClubId
      }

      setSentryUser(state.auth.user)
      setSentryClub(activeClubId)

      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as typeof error.config & { _retry?: boolean }

      captureFrontendException(error, {
        requestId: error.config?.headers?.['X-Request-ID'],
        method: error.config?.method,
        url: error.config?.url,
        status: error.response?.status,
      })

      if (error.response?.status === 401) {
        const requestUrl = error.config?.url
        const currentPath = window.location.pathname

        if (!originalRequest?._retry && !isAuthEndpoint(requestUrl)) {
          originalRequest._retry = true

          refreshPromise =
            refreshPromise ||
            api.post('/auth/refresh')
              .then((response) => {
                const accessToken = response.data?.accessToken || response.data?.token
                if (accessToken) store.dispatch(setToken(accessToken))
                if (response.data?.user) store.dispatch(setUser(response.data.user))
                return accessToken || null
              })
              .finally(() => {
                refreshPromise = null
              })

          const accessToken = await refreshPromise
          if (accessToken) {
            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return api(originalRequest)
          }
        }

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
