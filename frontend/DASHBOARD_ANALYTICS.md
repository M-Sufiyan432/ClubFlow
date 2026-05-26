# Dashboard & Analytics Module

## Overview

The Dashboard module provides real-time analytics, performance metrics, task tracking, and personalized insights for club members. All data is fetched from backend APIs with support for date filtering, multiple clubs, and member-level analytics.

## Features

### 1. Dashboard Summary
- **Assigned Tasks**: Total tasks assigned to the user
- **Overdue Tasks**: Count of tasks past their due date
- **Upcoming Events**: Number of upcoming events the user is invited to
- **Notifications**: Unread notification count
- **Productivity Score**: Overall productivity percentage based on task completion and engagement

### 2. Task Analytics
- **Completion Trend**: Line chart showing task completion rates over time (last 14 days)
- **Priority Distribution**: Pie chart showing tasks by priority level (High, Medium, Low)
- **Tasks by Status**: Bar chart showing task distribution across statuses
- **Top Performers**: List of members with highest task completion rates

### 3. Performance Analytics
- **Productivity Trend**: Area chart showing overall productivity metrics over 30 days
- **Club Performance**: Performance metrics for each club including:
  - Task completion rate
  - Active member count
  - Event attendance
- **Member Productivity**: Table and bar chart showing individual member scores
- **Detailed Member Stats**: Complete metrics including tasks completed, events attended, and average completion time

### 4. Notifications Panel
- **Real-time notifications**: Task updates, event reminders, member joins, system alerts
- **Priority-based styling**: Visual indicators for notification priority (High, Medium, Low)
- **Type icons**: Task, Event, Member, System notification types
- **Read status tracking**: Mark as read or delete individual notifications
- **Bulk actions**: Mark all notifications as read

### 5. Date Filtering
- **Quick filters**: Last 7/30/90 days, This month, Last month
- **Custom date range**: Pick any start and end date
- **Real-time updates**: Analytics refresh when date range changes
- **Reset option**: Return to default date range

## Backend API Endpoints

### Summary
```
GET /api/dashboard/summary?clubId=[id]
```
Returns: `DashboardSummary` object with high-level metrics

### Task Analytics
```
GET /api/analytics/tasks?clubId=[id]&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```
Returns: `TaskAnalytics` with trends, distributions, and top performers

### Performance Analytics
```
GET /api/analytics/performance?clubId=[id]&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&includeMembers=true
```
Returns: `PerformanceAnalytics` with club and member-level metrics

### Notifications
```
GET /api/notifications?unreadOnly=false&limit=10&offset=0
PATCH /api/notifications/{id}/read
PATCH /api/notifications/read-all
DELETE /api/notifications/{id}
```

## Data Types

### DashboardSummary
```typescript
interface DashboardSummary {
  userId: string
  activeClubs: number
  assignedTasks: number
  overdueTasks: number
  upcomingEvents: number
  unreadNotifications: number
  taskCompletionRate: number
  productivityScore: number
}
```

### TaskAnalytics
```typescript
interface TaskAnalytics {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  inProgressTasks: number
  byPriority: { high: number; medium: number; low: number }
  byStatus: Record<TaskStatus, number>
  completionTrendData: Array<{ date: string; completed: number; total: number; rate: number }>
  topAssignees: Array<{ userId: string; name: string; tasksCompleted: number; completionRate: number }>
}
```

### PerformanceAnalytics
```typescript
interface PerformanceAnalytics {
  overallProductivity: number
  clubPerformance: Array<{ clubId: string; taskCompletionRate: number; ... }>
  memberProductivity: Array<{ memberId: string; productivityScore: number; ... }>
  timeSeriesData: Array<{ date: string; tasksCompleted: number; ... }>
}
```

### DashboardNotification
```typescript
interface DashboardNotification {
  id: string
  type: 'task' | 'event' | 'member' | 'system'
  title: string
  message: string
  isRead: boolean
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}
```

## Components

### DashboardSummary
Displays high-level metrics in a 5-card grid layout with loading states and hover effects.

### TaskAnalyticsChart
Shows task completion trends and priority distributions using Recharts line and pie charts.

### PerformanceAnalytics
Displays productivity trends, club performance metrics, and member rankings with detailed tables.

### NotificationsPanel
Scrollable notification list with read/delete actions and type-based icons and colors.

### DashboardDateFilter
Provides quick filters and custom date range picker for analytics data.

## Redux Integration

### Store Slice: `analyticsSlice`
- **State**: summary, taskAnalytics, performanceAnalytics, notifications, isLoading, isFetching, error
- **Actions**: 
  - `fetchDashboardSummary(clubId?)`
  - `fetchTaskAnalytics(params)`
  - `fetchPerformanceAnalytics(params)`
  - `fetchNotifications(params)`
  - `markNotificationAsRead(id)`
  - `markAllNotificationsAsRead()`
  - `deleteNotification(id)`
  - `setDateRange(range)`
  - `clearDateRange()`

## Usage Examples

### Fetch all analytics
```typescript
const dispatch = useAppDispatch()

useEffect(() => {
  dispatch(fetchDashboardSummary(activeClub?.id))
  dispatch(fetchTaskAnalytics({ clubId: activeClub?.id }))
  dispatch(fetchPerformanceAnalytics({ clubId: activeClub?.id, includeMembers: true }))
  dispatch(fetchNotifications())
}, [activeClub?.id, dispatch])
```

### Filter by date range
```typescript
const handleDateChange = (startDate: string, endDate: string) => {
  dispatch(setDateRange({ startDate, endDate }))
  dispatch(fetchTaskAnalytics({ clubId: activeClub?.id, startDate, endDate }))
  dispatch(fetchPerformanceAnalytics({ clubId: activeClub?.id, startDate, endDate }))
}
```

### Mark notification as read
```typescript
const handleRead = async (id: string) => {
  await dispatch(markNotificationAsRead(id))
}
```

## Loading and Error States

All components have built-in loading states:
- Skeleton cards during initial load
- Animated pulse backgrounds for charts
- Error boundary support

## Charts Used

- **Line Chart**: Task completion trends (Recharts)
- **Pie Chart**: Priority distribution (Recharts)
- **Bar Chart**: Task status and member productivity (Recharts)
- **Area Chart**: Productivity trends (Recharts)
- **Progress Bars**: Club completion rates (HTML/CSS)

## Date Handling

Uses `date-fns` for all date operations:
- Relative time formatting ("2 hours ago")
- Date range calculations
- Month start/end calculations

## Performance Optimizations

- Lazy loading of analytics data
- Memoized component renders
- Efficient chart rendering with Recharts
- Pagination support for large datasets (notifications)
- Debounced date range changes

## Future Enhancements

- Export analytics as PDF/CSV
- Email notifications scheduled reports
- Advanced filtering by member, status, priority
- Comparison analytics (month-over-month, user-over-user)
- Real-time socket.io updates for notifications and analytics
- Customizable dashboard widgets
- Performance benchmarking against other clubs
