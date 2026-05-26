import api from './api'
import {
  DashboardSummary,
  TaskAnalytics,
  PerformanceAnalytics,
  DashboardNotification,
} from '@/types/index'
import {
  mapDashboardNotification,
  mapDashboardSummary,
  mapPerformanceAnalytics,
  mapTaskAnalytics,
  wrapData,
  unwrapApiData,
} from './adapters'

export const analyticsService = {
  // Dashboard summary
  getDashboardSummary: async (clubId?: string) => {
    if (clubId) {
      const response = await api.get(`/analytics/club/${clubId}/overview`)
      return wrapData(mapDashboardSummary(unwrapApiData(response)))
    }

    const response = await api.get('/analytics/dashboard')
    const data = unwrapApiData<any>(response)
    return wrapData({
      userId: '',
      activeClubs: 0,
      assignedTasks: data?.myTasks?.length || 0,
      overdueTasks: 0,
      upcomingEvents: data?.upcomingEvents?.length || 0,
      unreadNotifications: 0,
      taskCompletionRate: 0,
      productivityScore: 0,
    } as DashboardSummary)
  },

  // Task analytics
  getTaskAnalytics: async (clubId?: string, params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get(`/analytics/club/${clubId}/tasks`, { params })
    return wrapData(mapTaskAnalytics(unwrapApiData(response)))
  },

  // Performance analytics
  getPerformanceAnalytics: async (
    clubId?: string,
    params?: { startDate?: string; endDate?: string; includeMembers?: boolean }
  ) => {
    const response = await api.get(`/analytics/club/${clubId}/members`, { params })
    return wrapData(mapPerformanceAnalytics(unwrapApiData(response)))
  },

  // Get notifications
  getNotifications: async (params?: { unreadOnly?: boolean; limit?: number; offset?: number }) => {
    const response = await api.get('/notifications', {
      params,
    })
    const notifications = (unwrapApiData<any[]>(response) || []).map(mapDashboardNotification)
    return wrapData({ notifications, total: response.data?.total || notifications.length })
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: string) => {
    return api.put(`/notifications/${notificationId}/read`)
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    return api.put('/notifications/read-all')
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    return api.delete(`/notifications/${notificationId}`)
  },
}
