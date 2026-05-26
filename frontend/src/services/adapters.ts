import {
  Club,
  ClubMember,
  DashboardNotification,
  DashboardSummary,
  Event,
  EventAttendee,
  Notification,
  PerformanceAnalytics,
  RSVPStatus,
  Task,
  TaskAnalytics,
  TaskComment,
} from '@/types/index'

type MaybeId = {
  _id?: string
  id?: string
}

const getId = (value: MaybeId | string | undefined | null): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.id || value._id || ''
}

const mapTaskStatus = (status?: string): Task['status'] => {
  switch (status) {
    case 'inprogress':
      return 'in_progress'
    case 'review':
      return 'in_review'
    case 'completed':
      return 'done'
    case 'todo':
    default:
      return 'todo'
  }
}

const mapTaskPriority = (priority?: string): Task['priority'] => {
  switch (priority) {
    case 'critical':
      return 'urgent'
    case 'high':
    case 'medium':
    case 'low':
      return priority
    default:
      return 'medium'
  }
}

const mapRsvpStatus = (status?: string): RSVPStatus => {
  switch (status) {
    case 'going':
      return RSVPStatus.GOING
    case 'maybe':
      return RSVPStatus.INTERESTED
    case 'not_going':
      return RSVPStatus.NOT_GOING
    default:
      return RSVPStatus.NO_RESPONSE
  }
}

export const unwrapApiData = <T>(response: any): T => response?.data?.data ?? response?.data

export const wrapData = <T>(data: T) => ({ data })

export const mapClubMember = (member: any): ClubMember => ({
  id: getId(member?.user || member),
  userId: getId(member?.user || member),
  name: member?.user?.name || member?.name || '',
  email: member?.user?.email || member?.email || '',
  avatar: member?.user?.profilePhoto || member?.avatar,
  role: member?.role || 'member',
  joinedAt: member?.joinedAt || new Date().toISOString(),
})

export const mapClub = (club: any): Club => ({
  id: getId(club),
  name: club?.name || '',
  description: club?.description || '',
  image: club?.coverImage,
  logo: club?.logo,
  category: club?.category,
  status: club?.isActive === false ? 'archived' : 'active',
  owner: {
    id: getId(club?.createdBy),
    name: club?.createdBy?.name || '',
    email: club?.createdBy?.email || '',
    avatar: club?.createdBy?.profilePhoto,
  },
  members: Array.isArray(club?.members) ? club.members.map(mapClubMember) : [],
  memberCount: club?.members?.length || club?.memberCount || 0,
  createdAt: club?.createdAt || '',
  updatedAt: club?.updatedAt || '',
})

export const mapTaskComment = (comment: any): TaskComment => ({
  id: getId(comment),
  authorId: getId(comment?.user),
  author: {
    id: getId(comment?.user),
    name: comment?.user?.name || '',
    email: comment?.user?.email || '',
    avatar: comment?.user?.profilePhoto,
  },
  content: comment?.content || '',
  createdAt: comment?.createdAt || '',
  updatedAt: comment?.updatedAt || comment?.createdAt || '',
})

export const mapTask = (task: any): Task => {
  const status = mapTaskStatus(task?.status)
  const dueDate = task?.dueDate
  const isCompleted = status === 'done'
  const isOverdue = Boolean(dueDate) && !isCompleted && new Date(dueDate).getTime() < Date.now()
  const subtasks = Array.isArray(task?.subtasks)
    ? task.subtasks.map((subtask: any, index: number) => ({
        id: getId(subtask) || `${getId(task)}-subtask-${index}`,
        title: subtask?.title || '',
        completed: Boolean(subtask?.completed),
        completedAt: subtask?.completedAt,
      }))
    : []
  const completedSubtasks = subtasks.filter((subtask) => subtask.completed).length
  const progress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : isCompleted ? 100 : 0

  return {
    id: getId(task),
    clubId: getId(task?.club),
    title: task?.title || '',
    description: task?.description || '',
    status,
    priority: mapTaskPriority(task?.priority),
    dueDate,
    assignees: Array.isArray(task?.assignedTo)
      ? task.assignedTo.map((user: any) => ({
          id: getId(user),
          name: user?.name || '',
          email: user?.email || '',
          avatar: user?.profilePhoto,
        }))
      : [],
    tags: task?.tags || [],
    attachments: Array.isArray(task?.attachments)
      ? task.attachments.map((attachment: any, index: number) => ({
          id: getId(attachment) || `${getId(task)}-attachment-${index}`,
          fileName: attachment?.filename || '',
          fileSize: attachment?.fileSize || 0,
          fileType: attachment?.fileType || '',
          fileUrl: attachment?.url || '',
          uploadedAt: attachment?.uploadedAt || '',
        }))
      : [],
    comments: Array.isArray(task?.comments) ? task.comments.map(mapTaskComment) : [],
    editHistory: Array.isArray(task?.history)
      ? task.history.map((entry: any, index: number) => ({
          id: getId(entry) || `${getId(task)}-history-${index}`,
          field: entry?.field || entry?.action || '',
          oldValue: entry?.oldValue === undefined ? '' : String(entry.oldValue),
          newValue: entry?.newValue === undefined ? '' : String(entry.newValue),
          changedBy: {
            id: getId(entry?.user),
            name: entry?.user?.name || '',
            email: entry?.user?.email || '',
            avatar: entry?.user?.profilePhoto,
          },
          changedAt: entry?.timestamp || '',
        }))
      : [],
    dependencies: Array.isArray(task?.dependencies)
      ? task.dependencies.map((dependency: any, index: number) => ({
          id: getId(dependency) || `${getId(task)}-dependency-${index}`,
          taskId: getId(task),
          dependsOnTaskId: getId(dependency),
          type: 'blocked_by',
        }))
      : [],
    subtasks,
    isRecurring: Boolean(task?.isRecurring),
    recurringPattern: task?.recurrence?.frequency,
    recurringInterval: task?.recurrence?.interval,
    recurringEndDate: task?.recurrence?.endDate,
    isOverdue,
    progress,
    estimatedHours: task?.estimatedHours,
    actualHours: task?.actualHours,
    completedAt: task?.completedAt,
    createdBy: {
      id: getId(task?.createdBy),
      name: task?.createdBy?.name || '',
      email: task?.createdBy?.email || '',
      avatar: task?.createdBy?.profilePhoto,
    },
    createdAt: task?.createdAt || '',
    updatedAt: task?.updatedAt || '',
  }
}

export const mapEventAttendee = (response: any): EventAttendee => ({
  id: getId(response?.user || response),
  userId: getId(response?.user || response),
  name: response?.user?.name || response?.name || '',
  email: response?.user?.email || response?.email || '',
  avatar: response?.user?.profilePhoto || response?.avatar,
  rsvpStatus: mapRsvpStatus(response?.status),
  checkedIn: Boolean(response?.checkedInAt),
  checkedInAt: response?.checkedInAt,
  rsvpAt: response?.respondedAt || '',
})

export const mapEvent = (event: any): Event => {
  const attendees = Array.isArray(event?.rsvp?.responses)
    ? event.rsvp.responses.map(mapEventAttendee)
    : []

  return {
    id: getId(event),
    clubId: getId(event?.club),
    title: event?.title || '',
    description: event?.description || '',
    startDateTime: event?.startDate || '',
    endDateTime: event?.endDate || event?.startDate || '',
    location: event?.location?.address || event?.location?.onlineLink || event?.location || '',
    capacity: event?.capacity,
    image: event?.image,
    status: event?.isCancelled ? 'cancelled' : 'published',
    organizer: {
      id: getId(event?.createdBy),
      name: event?.createdBy?.name || '',
      email: event?.createdBy?.email || '',
      avatar: event?.createdBy?.profilePhoto,
    },
    attendees,
    attendeeCount: attendees.length,
    goingCount: attendees.filter((attendee) => attendee.rsvpStatus === RSVPStatus.GOING).length,
    interestedCount: attendees.filter((attendee) => attendee.rsvpStatus === RSVPStatus.INTERESTED).length,
    reminders: [],
    createdAt: event?.createdAt || '',
    updatedAt: event?.updatedAt || '',
  }
}

const groupCountsByKey = (items: Array<{ _id?: string; count?: number }> = []) =>
  items.reduce<Record<string, number>>((acc, item) => {
    if (item?._id) {
      acc[item._id] = item.count || 0
    }
    return acc
  }, {})

export const mapDashboardSummary = (summary: any): DashboardSummary => ({
  userId: '',
  activeClubs: summary?.totalMembers || 0,
  assignedTasks: summary?.totalTasks || 0,
  overdueTasks: summary?.overdueTasks || 0,
  upcomingEvents: summary?.upcomingEvents || 0,
  unreadNotifications: 0,
  taskCompletionRate: Number(summary?.completionRate || 0),
  productivityScore: Number(summary?.completionRate || 0),
})

export const mapTaskAnalytics = (analytics: any): TaskAnalytics => {
  const byStatusCounts = groupCountsByKey(analytics?.byStatus)
  const byPriorityCounts = groupCountsByKey(analytics?.byPriority)
  const totalTasks = Object.values(byStatusCounts).reduce((sum, count) => sum + count, 0)
  const completedTasks = byStatusCounts.completed || 0
  const inProgressTasks = (byStatusCounts.inprogress || 0) + (byStatusCounts.review || 0)

  return {
    totalTasks,
    completedTasks,
    overdueTasks: 0,
    inProgressTasks,
    byPriority: {
      high: (byPriorityCounts.high || 0) + (byPriorityCounts.critical || 0),
      medium: byPriorityCounts.medium || 0,
      low: byPriorityCounts.low || 0,
    },
    byStatus: {
      todo: byStatusCounts.todo || 0,
      in_progress: byStatusCounts.inprogress || 0,
      in_review: byStatusCounts.review || 0,
      done: byStatusCounts.completed || 0,
      archived: 0,
    },
    completionTrendData: [
      {
        date: new Date().toISOString(),
        completed: completedTasks,
        total: totalTasks,
        rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    ],
    topAssignees: [],
  }
}

export const mapPerformanceAnalytics = (items: any[] = []): PerformanceAnalytics => ({
  overallProductivity:
    items.length > 0
      ? items.reduce((sum, item) => sum + Number(item?.completionRate || 0), 0) / items.length
      : 0,
  clubPerformance: [],
  memberProductivity: items.map((item: any) => ({
    memberId: getId(item),
    name: item?.name || 'Unknown member',
    avatar: item?.profilePhoto,
    tasksCompleted: item?.tasksCompleted || 0,
    tasksAssigned: item?.tasksAssigned || 0,
    eventAttendance: 0,
    eventRsvp: 0,
    averageTaskCompletionDays: 0,
    productivityScore: Number(item?.completionRate || 0),
  })),
  timeSeriesData: [],
})

export const mapNotification = (notification: any): Notification => ({
  id: getId(notification),
  userId: getId(notification?.recipient),
  type: notification?.type || 'system',
  title: notification?.title || '',
  message: notification?.message || '',
  description: notification?.message || '',
  resourceType: notification?.data?.taskId ? 'task' : notification?.data?.eventId ? 'event' : undefined,
  resourceId: notification?.data?.taskId || notification?.data?.eventId,
  relatedUser: notification?.sender
    ? {
        id: getId(notification.sender),
        name: notification.sender.name || '',
        avatar: notification.sender.profilePhoto,
      }
    : undefined,
  isRead: Boolean(notification?.isRead),
  actionUrl: notification?.actionUrl,
  createdAt: notification?.createdAt || '',
  updatedAt: notification?.updatedAt || notification?.createdAt || '',
})

export const mapDashboardNotification = (notification: any): DashboardNotification => {
  const mapped = mapNotification(notification)
  const dashboardType: DashboardNotification['type'] =
    mapped.type.startsWith('task')
      ? 'task'
      : mapped.type.startsWith('event') || mapped.type === 'rsvp_response'
        ? 'event'
        : mapped.type.startsWith('member') || mapped.type.startsWith('club')
          ? 'member'
          : 'system'

  return {
    id: mapped.id,
    type: dashboardType,
    title: mapped.title,
    message: mapped.message,
    link: mapped.actionUrl,
    isRead: mapped.isRead,
    createdAt: mapped.createdAt,
    priority:
      mapped.type === 'task_overdue' ? 'high' : mapped.type === 'system' ? 'medium' : 'low',
  }
}
