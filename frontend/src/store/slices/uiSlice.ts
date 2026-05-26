import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  loading: boolean
  notification: {
    open: boolean
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  } | null
}

const initialState: UIState = {
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  sidebarOpen: true,
  loading: false,
  notification: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    showNotification: (
      state,
      action: PayloadAction<{
        message: string
        type: 'success' | 'error' | 'info' | 'warning'
      }>
    ) => {
      state.notification = {
        open: true,
        ...action.payload,
      }
    },
    hideNotification: (state) => {
      state.notification = null
    },
  },
})

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  showNotification,
  hideNotification,
} = uiSlice.actions
export default uiSlice.reducer
