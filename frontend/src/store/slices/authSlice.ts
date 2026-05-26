import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '@/services/auth.service'
import { LoginRequest, SignUpRequest } from '@/types/auth.types'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  roles: string[]
  role?: string
  clubId?: string
  clubs?: Array<{
    club: string | { id?: string; _id?: string; name?: string; logo?: string }
    role: string
    joinedAt?: string
  }>
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isVerifying: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isVerifying: true,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const signup = createAsyncThunk(
  'auth/signup',
  async (data: SignUpRequest, { rejectWithValue }) => {
    try {
      const response = await authService.signup(data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const verifySession = createAsyncThunk(
  'auth/verifySession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Session verification failed')
    }
  }
)

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout()
    } catch (error: any) {
      if (error.response?.status && [401, 403].includes(error.response.status)) {
        return true
      }
      return rejectWithValue(error.response?.data?.message || 'Logout failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearSession: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.isLoading = false
      state.isVerifying = false
      state.error = null
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      state.isAuthenticated = true
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

      .addCase(signup.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

      .addCase(verifySession.pending, (state) => {
        state.isVerifying = true
      })
      .addCase(verifySession.fulfilled, (state, action) => {
        state.isVerifying = false
        state.user = action.payload.user
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(verifySession.rejected, (state) => {
        state.isVerifying = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
      })

      .addCase(logoutAsync.pending, (state) => {
        state.isLoading = true
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
      })
      .addCase(logoutAsync.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
  },
})

export const { clearError, clearSession, setToken, setUser } = authSlice.actions
export default authSlice.reducer
