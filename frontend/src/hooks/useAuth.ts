import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login, signup, logoutAsync, clearError } from '@/store/slices/authSlice'
import { LoginRequest, SignUpRequest } from '@/types/auth.types'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((state) => state.auth)

  const handleLogin = useCallback(
    (credentials: LoginRequest) => {
      return dispatch(login(credentials))
    },
    [dispatch]
  )

  const handleSignup = useCallback(
    (data: SignUpRequest) => {
      return dispatch(signup(data))
    },
    [dispatch]
  )

  const handleLogout = useCallback(() => {
    return dispatch(logoutAsync())
  }, [dispatch])

  const handleClearError = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isVerifying: auth.isVerifying,
    error: auth.error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    clearError: handleClearError,
  }
}
