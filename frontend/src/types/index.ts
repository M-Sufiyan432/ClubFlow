// Enums
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CLUB_ADMIN = 'club_admin',
  MEMBER = 'member',
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// Club Types
export interface ClubMember {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  joinedAt: string
  inviteStatus?: InviteStatus
}

export interface ClubSettings {
  isPrivate: boolean
  allowPublicJoin: boolean
  requireApproval: boolean
  description: string
}

export interface ClubOwner {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface Club {
  id: string
  name: string
  description: string
  image?: string
  logo?: string
  category?: string
  status: 'active' | 'archived'
  owner: ClubOwner
  members: ClubMember[]
  memberCount: number
  settings?: ClubSettings
  createdAt: string
  updatedAt: string
}

export interface CreateClubRequest {
  name: string
  description: string
  category?: string
  logo?: string
  isPrivate?: boolean
}

export interface UpdateClubRequest {
  name?: string
  description?: string
  category?: string
  logo?: string
  settings?: Partial<ClubSettings>
}

export interface InviteMemberRequest {
  email: string
  role: UserRole
}

export interface UpdateMemberRoleRequest {
  role: UserRole
}

// Task Types
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  ARCHIVED = 'archived',
}

export interface TaskAssignee {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface TaskComment {
  id: string
  authorId: string
  author: TaskAssignee
  content: string
  createdAt: string
  updatedAt: string
}

export interface TaskAttachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  uploadedAt: string
}

export interface TaskEditHistory {
  id: string
  field: string
  oldValue: string
  newValue: string
  changedBy: TaskAssignee
  changedAt: string
}

export interface TaskDependency {
  id: string
  taskId: string
  dependsOnTaskId: string
  type: 'blocks' | 'blocked_by'
}

export interface TaskSubtask {
  id: string
  title: string
  completed: boolean
  completedAt?: string
}

export interface Task {
  id: string
  clubId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  startDate?: string
  assignees: TaskAssignee[]
  tags: string[]
  attachments: TaskAttachment[]
  comments: TaskComment[]
  editHistory: TaskEditHistory[]
  dependencies: TaskDependency[]
  subtasks: TaskSubtask[]
  isRecurring: boolean
  recurringPattern?: string
  recurringInterval?: number
  recurringEndDate?: string
  isOverdue: boolean
  progress: number
  estimatedHours?: number
  actualHours?: number
  completedAt?: string
  createdBy: TaskAssignee
  createdAt: string
  updatedAt: string
}

export interface CreateTaskRequest {
  title: string
  description: string
  priority: TaskPriority
  status?: TaskStatus
  dueDate?: string
  startDate?: string
  assigneeIds?: string[]
  tags?: string[]
  attachments?: Array<{ filename: string; url: string; fileType?: string; fileSize?: number }>
  dependencies?: string[]
  isRecurring?: boolean
  recurringPattern?: string
  recurringInterval?: number
  recurringEndDate?: string
  estimatedHours?: number
  subtasks?: Array<{ title: string }>
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  dueDate?: string
  startDate?: string
  assigneeIds?: string[]
  tags?: string[]
  attachments?: Array<{ filename: string; url: string; fileType?: string; fileSize?: number }>
  dependencies?: string[]
  estimatedHours?: number
  actualHours?: number
  subtasks?: Array<{ title: string }>
}

export interface AddTaskCommentRequest {
  content: string
}

export interface TaskFilter {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assignees?: string[]
  tags?: string[]
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  dateRange?: {
    start: string
    end: string
  }
}

// Dashboard & Analytics Types
export interface DashboardSummary {
  userId: string
  activeClubs: number
  assignedTasks: number
  overdueTasks: number
  upcomingEvents: number
  unreadNotifications: number
  taskCompletionRate: number
  productivityScore: number
}

export interface TaskAnalytics {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  inProgressTasks: number
  byPriority: {
    high: number
    medium: number
    low: number
  }
  byStatus: Record<TaskStatus, number>
  completionTrendData: Array<{
    date: string
    completed: number
    total: number
    rate: number
  }>
  topAssignees: Array<{
    userId: string
    name: string
    avatar?: string
    tasksCompleted: number
    taskCount: number
    completionRate: number
  }>
}

export interface PerformanceAnalytics {
  overallProductivity: number
  clubPerformance: Array<{
    clubId: string
    clubName: string
    taskCompletionRate: number
    memberCount: number
    activeMembers: number
    eventCount: number
    upcomingEvents: number
  }>
  memberProductivity: Array<{
    memberId: string
    name: string
    avatar?: string
    tasksCompleted: number
    tasksAssigned: number
    eventAttendance: number
    eventRsvp: number
    averageTaskCompletionDays: number
    productivityScore: number
  }>
  timeSeriesData: Array<{
    date: string
    tasksCompleted: number
    eventsAttended: number
    overallProductivity: number
  }>
}

export interface DashboardNotification {
  id: string
  type: 'task' | 'event' | 'member' | 'system'
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
  priority: 'high' | 'medium' | 'low'
}

export interface DashboardFilters {
  dateRange?: {
    startDate: string
    endDate: string
  }
  clubId?: string
  status?: string[]
}

// Event Types
export enum RSVPStatus {
  GOING = 'going',
  INTERESTED = 'interested',
  NOT_GOING = 'not_going',
  NO_RESPONSE = 'no_response',
}

export interface EventAttendee {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  rsvpStatus: RSVPStatus
  checkedIn: boolean
  checkedInAt?: string
  rsvpAt: string
}

export interface EventReminder {
  id: string
  eventId: string
  userId: string
  reminderTime: string // 'on_day' | '1_day_before' | '1_week_before'
  isSent: boolean
  sentAt?: string
}

export interface Event {
  id: string
  clubId: string
  title: string
  description: string
  startDateTime: string
  endDateTime: string
  location: string
  capacity?: number
  image?: string
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  organizer: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  attendees: EventAttendee[]
  attendeeCount: number
  goingCount: number
  interestedCount: number
  reminders: EventReminder[]
  createdAt: string
  updatedAt: string
}

export interface CreateEventRequest {
  title: string
  description: string
  startDateTime: string
  endDateTime: string
  location: string
  capacity?: number
  image?: string
}

export interface UpdateEventRequest {
  title?: string
  description?: string
  startDateTime?: string
  endDateTime?: string
  location?: string
  capacity?: number
  image?: string
  status?: 'draft' | 'published' | 'cancelled' | 'completed'
}

export interface RSVPRequest {
  status: RSVPStatus
}

export interface CheckInRequest {
  eventId: string
}

// Legacy Member Type (backward compatibility)
export interface Member {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'member'
  joinedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Admin Types
export interface AdminUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  status: 'active' | 'suspended' | 'banned'
  lastLogin?: string
  createdAt: string
  clubsOwned: number
  tasksAssigned: number
}

export interface AdminClub {
  id: string
  name: string
  owner: {
    id: string
    name: string
    email: string
  }
  status: 'active' | 'archived'
  memberCount: number
  taskCount: number
  eventCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminTask {
  id: string
  title: string
  clubId: string
  clubName: string
  assigneeId: string
  assigneeName: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  createdAt: string
  isOverdue: boolean
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userEmail: string
  action: string
  targetType: 'user' | 'club' | 'task' | 'event' | 'member'
  targetId: string
  targetName?: string
  changes?: Record<string, { before: any; after: any }>
  ipAddress?: string
  status: 'success' | 'failed'
  message?: string
  timestamp: string
}

export interface SystemHealth {
  uptime: number
  activeUsers: number
  totalUsers: number
  totalClubs: number
  totalTasks: number
  totalEvents: number
  databaseHealth: 'healthy' | 'degraded' | 'critical'
  apiHealth: 'healthy' | 'degraded' | 'critical'
  cacheHealth: 'healthy' | 'degraded' | 'critical'
  lastUpdated: string
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Notification Types
export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_DUE_SOON = 'task_due_soon',
  TASK_OVERDUE = 'task_overdue',
  TASK_COMMENTED = 'task_commented',
  EVENT_CREATED = 'event_created',
  EVENT_REMINDER = 'event_reminder',
  MEMBER_ADDED = 'member_added',
  MEMBER_LEFT = 'member_left',
  CLUB_UPDATED = 'club_updated',
  RSVP_RESPONSE = 'rsvp_response',
  SYSTEM = 'system',
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  description?: string
  icon?: string
  resourceType?: string
  resourceId?: string
  relatedUser?: {
    id: string
    name: string
    avatar?: string
  }
  isRead: boolean
  actionUrl?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationFilters {
  type?: NotificationType
  isRead?: boolean
  limit?: number
  offset?: number
}
