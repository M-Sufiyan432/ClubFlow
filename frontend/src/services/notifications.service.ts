import api from './api'
import { Notification, NotificationFilters, PaginatedResponse } from '@/types/index'
import { mapNotification, wrapData, unwrapApiData } from './adapters'

export const notificationsService = {
  // Fetch all notifications
  listNotifications: async (filters?: NotificationFilters) => {
    const response = await api.get('/notifications', { params: filters })
    const notifications = (unwrapApiData<any[]>(response) || []).map(mapNotification)
    return wrapData({ data: notifications } as PaginatedResponse<Notification>)
  },

  // Fetch single notification
  getNotification: async (notificationId: string) => {
    const response = await api.get<Notification>(`/notifications/${notificationId}`)
    return wrapData(mapNotification(unwrapApiData(response)))
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await api.put<Notification>(`/notifications/${notificationId}/read`)
    return wrapData(mapNotification(unwrapApiData(response)))
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all')
    return wrapData({ updated: response.data?.updated || 0 })
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    return api.delete(`/notifications/${notificationId}`)
  },

  // Delete all notifications
  deleteAllNotifications: async () => {
    return api.delete('/notifications')
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread')
    return wrapData({ unreadCount: response.data?.count || 0 })
  },
}
