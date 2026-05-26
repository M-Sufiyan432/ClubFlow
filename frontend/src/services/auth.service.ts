import api from './api'
import {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
  CurrentUserResponse,
  UpdateProfileRequest,
} from '@/types/auth.types'
import { wrapData, unwrapApiData } from './adapters'

const mapAuthUser = (user: any) => ({
  id: user?.id || user?._id || '',
  email: user?.email || '',
  name: user?.name || '',
  avatar: user?.avatar || user?.profilePhoto,
  role: user?.role,
  roles: Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [],
  clubId: user?.clubId || user?.clubs?.[0]?.club?.id || user?.clubs?.[0]?.club?._id || user?.clubs?.[0]?.club || undefined,
  clubs: Array.isArray(user?.clubs) ? user.clubs : [],
})

export const authService = {
  login: async (credentials: LoginRequest) => {
    const response = await api.post<LoginResponse>('/auth/login', credentials)
    const data = unwrapApiData<LoginResponse>(response) || response.data
    return wrapData({
      ...data,
      user: mapAuthUser((data as any)?.user),
    })
  },

  signup: async (data: SignUpRequest) => {
    const response = await api.post<SignUpResponse>('/auth/register', data)
    const payload = unwrapApiData<SignUpResponse>(response) || response.data
    return wrapData({
      ...payload,
      user: mapAuthUser((payload as any)?.user),
    })
  },

  logout: () =>
    api.post('/auth/logout'),

  getCurrentUser: async () => {
    const response = await api.get<CurrentUserResponse>('/auth/me')
    return wrapData({ user: mapAuthUser(unwrapApiData(response)) })
  },

  refreshToken: () =>
    api.post('/auth/refresh'),

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgotpassword', { email })
    return wrapData(response.data)
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.put<LoginResponse>(`/auth/resetpassword/${token}`, { password })
    const payload = unwrapApiData<LoginResponse>(response) || response.data
    return wrapData({
      ...payload,
      user: mapAuthUser((payload as any)?.user),
    })
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await api.put('/users/profile', data)
    const payload = response.data?.data || response.data?.user || response.data
    return wrapData({ user: mapAuthUser(payload) })
  },
}
