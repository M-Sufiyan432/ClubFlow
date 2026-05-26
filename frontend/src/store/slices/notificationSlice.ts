import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { notificationsService } from '@/services/notifications.service'
import { Notification, NotificationType } from '@/types/index'

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  isFetching: boolean
  error: string | null
  filter: {
    type?: NotificationType
    isRead?: boolean
  }
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isFetching: false,
  error: null,
  filter: {},
}

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (filters?: { type?: NotificationType; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await notificationsService.listNotifications(filters)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications')
    }
  }
)

export const getUnreadCount = createAsyncThunk(
  'notifications/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsService.getUnreadCount()
      return response.data.unreadCount
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get unread count')
    }
  }
)

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await notificationsService.markAsRead(notificationId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read')
    }
  }
)

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsService.markAllAsRead()
      return response.data.updated
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read')
    }
  }
)

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationsService.deleteNotification(notificationId)
      return notificationId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification')
    }
  }
)

export const deleteAllNotifications = createAsyncThunk(
  'notifications/deleteAllNotifications',
  async (_, { rejectWithValue }) => {
    try {
      await notificationsService.deleteAllNotifications()
      return true
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete all notifications')
    }
  }
)

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setFilter: (state, action: PayloadAction<{ type?: NotificationType; isRead?: boolean }>) => {
      state.filter = action.payload
    },
    clearFilter: (state) => {
      state.filter = {}
    },
    // Add notification from Socket.IO
    addNotificationFromSocket: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload)
      if (!action.payload.isRead) {
        state.unreadCount += 1
      }
    },
    // Update notification from Socket.IO
    updateNotificationFromSocket: (state, action: PayloadAction<Notification>) => {
      const index = state.notifications.findIndex((n) => n.id === action.payload.id)
      if (index !== -1) {
        const wasRead = state.notifications[index].isRead
        state.notifications[index] = action.payload
        if (wasRead && !action.payload.isRead) {
          state.unreadCount += 1
        } else if (!wasRead && action.payload.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isFetching = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isFetching = false
        state.notifications = action.payload
        state.unreadCount = action.payload.filter((n) => !n.isRead).length
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isFetching = false
        state.error = action.payload as string
      })

      // Get unread count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload
      })

      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload.id)
        if (notification && !notification.isRead) {
          notification.isRead = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })

      // Mark all as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true
        })
        state.unreadCount = 0
      })

      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex((n) => n.id === action.payload)
        if (index !== -1) {
          const notification = state.notifications[index]
          state.notifications.splice(index, 1)
          if (!notification.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1)
          }
        }
      })

      // Delete all notifications
      .addCase(deleteAllNotifications.fulfilled, (state) => {
        state.notifications = []
        state.unreadCount = 0
      })
  },
})

export const { clearError, setFilter, clearFilter, addNotificationFromSocket, updateNotificationFromSocket } =
  notificationSlice.actions
export default notificationSlice.reducer
