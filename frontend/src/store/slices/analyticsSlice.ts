import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { analyticsService } from '@/services/analytics.service'
import {
  DashboardSummary,
  TaskAnalytics,
  PerformanceAnalytics,
  DashboardNotification,
} from '@/types/index'

export interface AnalyticsState {
  summary: DashboardSummary | null
  taskAnalytics: TaskAnalytics | null
  performanceAnalytics: PerformanceAnalytics | null
  notifications: DashboardNotification[]
  unreadNotificationsCount: number
  isLoading: boolean
  isFetching: boolean
  error: string | null
  dateRange: {
    startDate: string
    endDate: string
  } | null
}

const initialState: AnalyticsState = {
  summary: null,
  taskAnalytics: null,
  performanceAnalytics: null,
  notifications: [],
  unreadNotificationsCount: 0,
  isLoading: false,
  isFetching: false,
  error: null,
  dateRange: null,
}

// Async thunks
export const fetchDashboardSummary = createAsyncThunk(
  'analytics/fetchDashboardSummary',
  async (clubId?: string, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getDashboardSummary(clubId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard summary')
    }
  }
)

export const fetchTaskAnalytics = createAsyncThunk(
  'analytics/fetchTaskAnalytics',
  async (
    params: { clubId?: string; startDate?: string; endDate?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await analyticsService.getTaskAnalytics(params.clubId, {
        startDate: params.startDate,
        endDate: params.endDate,
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task analytics')
    }
  }
)

export const fetchPerformanceAnalytics = createAsyncThunk(
  'analytics/fetchPerformanceAnalytics',
  async (
    params: { clubId?: string; startDate?: string; endDate?: string; includeMembers?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await analyticsService.getPerformanceAnalytics(params.clubId, {
        startDate: params.startDate,
        endDate: params.endDate,
        includeMembers: params.includeMembers,
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch performance analytics')
    }
  }
)

export const fetchNotifications = createAsyncThunk(
  'analytics/fetchNotifications',
  async (params?: { unreadOnly?: boolean; limit?: number; offset?: number }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getNotifications(params)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications')
    }
  }
)

export const markNotificationAsRead = createAsyncThunk(
  'analytics/markNotificationAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await analyticsService.markNotificationAsRead(notificationId)
      return notificationId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read')
    }
  }
)

export const markAllNotificationsAsRead = createAsyncThunk(
  'analytics/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await analyticsService.markAllNotificationsAsRead()
      return true
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notifications as read')
    }
  }
)

export const deleteNotification = createAsyncThunk(
  'analytics/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await analyticsService.deleteNotification(notificationId)
      return notificationId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification')
    }
  }
)

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setDateRange: (state, action: PayloadAction<{ startDate: string; endDate: string }>) => {
      state.dateRange = action.payload
    },
    clearDateRange: (state) => {
      state.dateRange = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard summary
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.isLoading = false
        state.summary = action.payload
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Fetch task analytics
      .addCase(fetchTaskAnalytics.pending, (state) => {
        state.isFetching = true
        state.error = null
      })
      .addCase(fetchTaskAnalytics.fulfilled, (state, action) => {
        state.isFetching = false
        state.taskAnalytics = action.payload
      })
      .addCase(fetchTaskAnalytics.rejected, (state, action) => {
        state.isFetching = false
        state.error = action.payload as string
      })

      // Fetch performance analytics
      .addCase(fetchPerformanceAnalytics.pending, (state) => {
        state.isFetching = true
        state.error = null
      })
      .addCase(fetchPerformanceAnalytics.fulfilled, (state, action) => {
        state.isFetching = false
        state.performanceAnalytics = action.payload
      })
      .addCase(fetchPerformanceAnalytics.rejected, (state, action) => {
        state.isFetching = false
        state.error = action.payload as string
      })

      // Fetch notifications
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications
        state.unreadNotificationsCount = action.payload.notifications.filter(
          (n) => !n.isRead
        ).length
      })

      // Mark notification as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload)
        if (notification) {
          notification.isRead = true
          state.unreadNotificationsCount = Math.max(0, state.unreadNotificationsCount - 1)
        }
      })

      // Mark all as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }))
        state.unreadNotificationsCount = 0
      })

      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload)
        if (notification && !notification.isRead) {
          state.unreadNotificationsCount = Math.max(0, state.unreadNotificationsCount - 1)
        }
        state.notifications = state.notifications.filter((n) => n.id !== action.payload)
      })
  },
})

export const { clearError, setDateRange, clearDateRange } = analyticsSlice.actions
export default analyticsSlice.reducer
