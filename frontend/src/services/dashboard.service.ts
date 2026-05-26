import api from './api'
import { Event, Task, TaskAnalytics, PerformanceAnalytics, DashboardSummary, AdminUser, AdminClub, AdminTask, AuditLog, SystemHealth } from '@/types/index'
import { mapEvent, mapPerformanceAnalytics, mapTask, mapTaskAnalytics, wrapData, unwrapApiData } from './adapters'

type PersonalDashboard = {
  myTasks: Task[]
  upcomingEvents: Event[]
}

type ClubOverview = DashboardSummary & {
  totalMembers: number
  totalTasks: number
  completedTasks: number
  totalEvents: number
  upcomingEventsCount: number
}

type AdminOverview = {
  totalUsers: number
  totalClubs: number
  totalTasks: number
  totalEvents: number
}

const getId = (value: any) => value?.id || value?._id || ''

const mapAdminUser = (user: any): AdminUser => ({
  id: getId(user),
  name: user?.name || '',
  email: user?.email || '',
  avatar: user?.profilePhoto,
  role: user?.role === 'superadmin' ? 'super_admin' : user?.role === 'admin' ? 'club_admin' : 'member',
  status: user?.isActive === false ? 'suspended' : 'active',
  lastLogin: user?.lastLogin,
  createdAt: user?.createdAt || '',
  clubsOwned: Array.isArray(user?.clubs) ? user.clubs.filter((club: any) => club?.role === 'president').length : 0,
  tasksAssigned: 0,
})

const mapAdminClub = (club: any): AdminClub => ({
  id: getId(club),
  name: club?.name || '',
  owner: {
    id: getId(club?.createdBy),
    name: club?.createdBy?.name || '',
    email: club?.createdBy?.email || '',
  },
  status: club?.isActive === false ? 'archived' : 'active',
  memberCount: club?.members?.length || 0,
  taskCount: club?.stats?.totalTasks || 0,
  eventCount: club?.stats?.totalEvents || 0,
  createdAt: club?.createdAt || '',
  updatedAt: club?.updatedAt || '',
})

const mapAdminTask = (task: any): AdminTask => {
  const assignee = Array.isArray(task?.assignedTo) ? task.assignedTo[0] : null
  const mapped = mapTask(task)

  return {
    id: mapped.id,
    title: mapped.title,
    clubId: getId(task?.club),
    clubName: task?.club?.name || '',
    assigneeId: getId(assignee),
    assigneeName: assignee?.name || 'Unassigned',
    status: mapped.status,
    priority: mapped.priority,
    dueDate: mapped.dueDate || '',
    createdAt: mapped.createdAt,
    isOverdue: mapped.isOverdue,
  }
}

const mapAuditLog = (log: any): AuditLog => ({
  id: getId(log),
  userId: getId(log?.user),
  userName: log?.user?.name || 'System',
  userEmail: log?.user?.email || '',
  action: log?.action || '',
  targetType: (log?.entityType || 'System').toLowerCase() as AuditLog['targetType'],
  targetId: getId(log?.entityId) || String(log?.entityId || ''),
  targetName: log?.description || '',
  changes: log?.changes,
  ipAddress: log?.metadata?.ipAddress,
  status: log?.severity === 'critical' ? 'failed' : 'success',
  message: log?.description || '',
  timestamp: log?.createdAt || '',
})

export const dashboardService = {
  getPersonalDashboard: async () => {
    const response = await api.get('/dashboard', { timeout: 45000 })
    const data = unwrapApiData<any>(response)
    return wrapData<PersonalDashboard>({
      myTasks: Array.isArray(data?.myTasks) ? data.myTasks.map(mapTask).sort((a, b) => {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
        return aTime - bTime
      }) : [],
      upcomingEvents: Array.isArray(data?.upcomingEvents) ? data.upcomingEvents.map(mapEvent) : [],
    })
  },

  getOverview: async (clubId?: string) => {
    const response = await api.get(clubId ? `/analytics/club/${clubId}/overview` : '/analytics/overview', { timeout: 45000 })
    const data = unwrapApiData<any>(response)
    return wrapData<ClubOverview>({
      userId: '',
      activeClubs: data?.totalMembers || 0,
      assignedTasks: data?.totalTasks || 0,
      overdueTasks: data?.overdueTasks || 0,
      upcomingEvents: data?.upcomingEvents || 0,
      unreadNotifications: 0,
      taskCompletionRate: Number(data?.completionRate || 0),
      productivityScore: Number(data?.completionRate || 0),
      totalMembers: data?.totalMembers || 0,
      totalTasks: data?.totalTasks || 0,
      completedTasks: data?.completedTasks || 0,
      totalEvents: data?.totalEvents || 0,
      upcomingEventsCount: data?.upcomingEvents || 0,
    })
  },

  getTaskAnalytics: async (clubId?: string) => {
    const response = await api.get(clubId ? `/analytics/club/${clubId}/tasks` : '/analytics/tasks', { timeout: 45000 })
    return wrapData<TaskAnalytics>(mapTaskAnalytics(unwrapApiData(response)))
  },

  getProductivity: async (clubId?: string) => {
    const response = await api.get(clubId ? `/analytics/club/${clubId}/members` : '/analytics/productivity', { timeout: 60000 })
    return wrapData<PerformanceAnalytics>(mapPerformanceAnalytics(unwrapApiData(response)))
  },

  getAdminOverview: async () => {
    const response = await api.get('/admin/dashboard', { timeout: 45000 })
    return wrapData<AdminOverview>(unwrapApiData(response))
  },

  getAdminUsers: async () => {
    const response = await api.get('/admin/users', { timeout: 60000 })
    const users = (unwrapApiData<any[]>(response) || []).map(mapAdminUser)
    return wrapData({ users, total: response.data?.total || users.length })
  },

  getAdminClubs: async () => {
    const response = await api.get('/admin/clubs', { timeout: 60000 })
    const clubs = (unwrapApiData<any[]>(response) || []).map(mapAdminClub)
    return wrapData({ clubs, total: response.data?.total || clubs.length })
  },

  getAdminTasks: async () => {
    const response = await api.get('/admin/tasks', { timeout: 60000 })
    const tasks = (unwrapApiData<any[]>(response) || []).map(mapAdminTask)
    return wrapData({ tasks, total: response.data?.total || tasks.length })
  },

  getAuditLogs: async () => {
    const response = await api.get('/admin/audit-logs', { params: { limit: 10 }, timeout: 45000 })
    const logs = (unwrapApiData<any[]>(response) || []).map(mapAuditLog)
    return wrapData({ logs, total: response.data?.total || logs.length })
  },

  getSystemHealth: async () => {
    const response = await api.get('/admin/dashboard', { timeout: 45000 })
    const data = unwrapApiData<any>(response)
    return wrapData<SystemHealth>({
      uptime: 0,
      activeUsers: data?.totalUsers || 0,
      totalUsers: data?.totalUsers || 0,
      totalClubs: data?.totalClubs || 0,
      totalTasks: data?.totalTasks || 0,
      totalEvents: data?.totalEvents || 0,
      databaseHealth: 'healthy',
      apiHealth: 'healthy',
      cacheHealth: 'healthy',
      lastUpdated: new Date().toISOString(),
    })
  },
}
