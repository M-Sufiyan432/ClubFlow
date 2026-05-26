import React, { useEffect, useMemo, useState } from 'react'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { dashboardService } from '@/services/dashboard.service'
import { getClubRoleForClub, resolveDashboardKind } from '@/utils/rbac'
import { fetchNotifications } from '@/store/slices/notificationSlice'
import {
  AdminClub,
  AdminTask,
  AdminUser,
  AuditLog,
  DashboardSummary,
  Event,
  PerformanceAnalytics,
  SystemHealth,
  Task,
  TaskAnalytics,
} from '@/types/index'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton'
import {
  AlertCircle,
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Shield,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type DashboardDataState = {
  personal: { myTasks: Task[]; upcomingEvents: Event[] } | null
  overview: (DashboardSummary & {
    totalMembers?: number
    totalTasks?: number
    completedTasks?: number
    totalEvents?: number
    upcomingEventsCount?: number
  }) | null
  taskAnalytics: TaskAnalytics | null
  productivity: PerformanceAnalytics | null
  adminOverview: { totalUsers: number; totalClubs: number; totalTasks: number; totalEvents: number } | null
  adminUsers: AdminUser[]
  adminClubs: AdminClub[]
  adminTasks: AdminTask[]
  auditLogs: AuditLog[]
  systemHealth: SystemHealth | null
}

const initialState: DashboardDataState = {
  personal: null,
  overview: null,
  taskAnalytics: null,
  productivity: null,
  adminOverview: null,
  adminUsers: [],
  adminClubs: [],
  adminTasks: [],
  auditLogs: [],
  systemHealth: null,
}

const statusColors = ['#0f172a', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6']
const priorityColors = ['#38bdf8', '#60a5fa', '#f59e0b', '#ef4444']

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'

const percent = (value: number) => `${Math.round(value)}%`

const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <Card className="border-dashed bg-card shadow-none">
    <CardContent className="py-10 text-center">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
)

const scrollAreaClass =
  'max-h-[420px] overflow-y-auto pr-2'

const StatCard: React.FC<{
  label: string
  value: string | number
  hint: string
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate'
}> = ({ label, value, hint, tone = 'slate' }) => {
  const tones = {
    blue: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    red: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    slate: 'bg-slate-50 text-slate-700 dark:bg-white/5 dark:text-slate-300',
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${tones[tone]}`}>
          {label}
        </div>
        <p className="mt-4 text-3xl font-semibold text-foreground">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

const TaskListCard: React.FC<{ title: string; description: string; tasks: Task[] }> = ({ title, description, tasks }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {tasks.length === 0 ? (
        <EmptyState title="No tasks" description="Nothing needs action here right now." />
      ) : (
        <div className={`space-y-3 ${scrollAreaClass}`}>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-lg border p-4 ${
                task.isOverdue
                  ? 'border-rose-200 bg-rose-50/80 dark:border-rose-500/20 dark:bg-rose-950/20'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">{task.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description || 'No description.'}</p>
                </div>
                <Badge variant={task.isOverdue ? 'destructive' : 'secondary'}>{task.status.replace('_', ' ')}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Due {formatDate(task.dueDate)}</span>
                <span className="capitalize">{task.priority} priority</span>
                <span>{task.progress}% complete</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)

const EventsCard: React.FC<{ title: string; description: string; events: Event[] }> = ({ title, description, events }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {events.length === 0 ? (
        <EmptyState title="No upcoming events" description="Events will appear here when they are scheduled." />
      ) : (
        <div className={`space-y-3 ${scrollAreaClass}`}>
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">{event.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{event.location || 'Location not set'}</p>
                </div>
                <Badge variant="secondary">{formatDate(event.startDateTime)}</Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{event.goingCount || event.attendeeCount || 0} RSVP responses</p>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)

const NotificationsCard: React.FC = () => {
  const { notifications, unreadCount, isFetching } = useAppSelector((state) => state.notifications)

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Updates that need your attention.</CardDescription>
          </div>
          <Badge variant={unreadCount > 0 ? 'default' : 'secondary'}>{unreadCount} unread</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isFetching && notifications.length === 0 ? (
          <SkeletonCard />
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" description="You are caught up." />
        ) : (
          <div className={`space-y-3 ${scrollAreaClass}`}>
            {notifications.map((notification) => (
              <div key={notification.id} className={`rounded-lg border p-3 ${notification.isRead ? 'border-border bg-card' : 'border-primary/20 bg-primary/10'}`}>
                <p className="font-medium text-foreground">{notification.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{notification.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const TaskCharts: React.FC<{ analytics: TaskAnalytics | null }> = ({ analytics }) => {
  if (!analytics) {
    return <EmptyState title="No task charts" description="Task analytics will appear once chart data is available." />
  }

  const statusData = Object.entries(analytics.byStatus).map(([name, value]) => ({ name: name.replace('_', ' '), value }))
  const priorityData = [
    { name: 'High', value: analytics.byPriority.high },
    { name: 'Medium', value: analytics.byPriority.medium },
    { name: 'Low', value: analytics.byPriority.low },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Task Charts</CardTitle>
          <CardDescription>Status workflow: todo to in progress to review to completed.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={104} paddingAngle={3}>
                {statusData.map((entry, index) => (
                  <Cell key={entry.name} fill={statusColors[index % statusColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Priority Load</CardTitle>
          <CardDescription>High, medium, and low priority task distribution.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={entry.name} fill={priorityColors[index % priorityColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

const ProductivityCard: React.FC<{ productivity: PerformanceAnalytics | null; limited?: boolean }> = ({ productivity, limited }) => {
  const rows = limited ? productivity?.memberProductivity.slice(0, 5) || [] : productivity?.memberProductivity || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>{limited ? 'Productivity Snapshot' : 'Member Productivity'}</CardTitle>
        <CardDescription>{limited ? 'Limited task completion view.' : 'Assigned and completed task performance by member.'}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title="No productivity data" description="Productivity appears after tasks are assigned and completed." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Assigned</th>
                  <th className="px-4 py-3 font-medium">Completed</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((member) => (
                  <tr key={member.memberId} className="border-t border-slate-200/70 dark:border-white/10">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{member.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{member.tasksAssigned}</td>
                    <td className="px-4 py-3 text-muted-foreground">{member.tasksCompleted}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{percent(member.productivityScore)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const AdminTables: React.FC<{ users: AdminUser[]; clubs: AdminClub[]; tasks: AdminTask[]; logs: AuditLog[] }> = ({ users, clubs, tasks, logs }) => (
  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card>
      <CardHeader><CardTitle>System Stats</CardTitle><CardDescription>Latest users, clubs, and tasks.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-semibold">Recent Users</p>
          {users.slice(0, 5).map((user) => <p key={user.id} className="text-sm text-muted-foreground">{user.name} - {user.email}</p>)}
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Recent Clubs</p>
          {clubs.slice(0, 5).map((club) => <p key={club.id} className="text-sm text-muted-foreground">{club.name} - {club.memberCount} members</p>)}
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Recent Tasks</p>
          {tasks.slice(0, 5).map((task) => <p key={task.id} className="text-sm text-muted-foreground">{task.title} - {task.clubName}</p>)}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Audit Logs</CardTitle><CardDescription>Latest tracked system actions.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {logs.length === 0 ? (
          <EmptyState title="No audit logs" description="System actions will appear here." />
        ) : (
          logs.slice(0, 10).map((log) => (
            <div key={log.id} className="rounded-lg border border-border bg-card p-3">
              <p className="font-medium text-foreground">{log.action}</p>
              <p className="text-sm text-muted-foreground">{log.message || log.targetName}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  </div>
)

export const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const activeClub = useAppSelector((state) => state.clubs.activeClub)
  const tasks = useAppSelector((state) => state.tasks.tasks)
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount)
  const dashboardKind = resolveDashboardKind(user, activeClub?.id)
  const clubRole = getClubRoleForClub(user, activeClub?.id)

  const [data, setData] = useState<DashboardDataState>(initialState)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 10 }))
  }, [dispatch])

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const personalPromise = dashboardService.getPersonalDashboard()

        if (dashboardKind === 'admin') {
          const [personal, adminOverview, adminUsers, adminClubs, adminTasks, auditLogs, systemHealth] = await Promise.all([
            personalPromise,
            dashboardService.getAdminOverview(),
            dashboardService.getAdminUsers(),
            dashboardService.getAdminClubs(),
            dashboardService.getAdminTasks(),
            dashboardService.getAuditLogs(),
            dashboardService.getSystemHealth(),
          ])

          if (!cancelled) {
            setData({
              ...initialState,
              personal: personal.data,
              adminOverview: adminOverview.data,
              adminUsers: adminUsers.data.users,
              adminClubs: adminClubs.data.clubs,
              adminTasks: adminTasks.data.tasks,
              auditLogs: auditLogs.data.logs,
              systemHealth: systemHealth.data,
            })
          }
          return
        }

        if (['president', 'vicepresident', 'secretary'].includes(dashboardKind) && activeClub?.id) {
          const [personal, overview, taskAnalytics, productivity] = await Promise.all([
            personalPromise,
            dashboardService.getOverview(activeClub.id),
            dashboardKind === 'secretary' ? Promise.resolve({ data: null }) : dashboardService.getTaskAnalytics(activeClub.id),
            dashboardKind === 'president' || dashboardKind === 'vicepresident'
              ? dashboardService.getProductivity(activeClub.id)
              : Promise.resolve({ data: null }),
          ])

          if (!cancelled) {
            setData({
              ...initialState,
              personal: personal.data,
              overview: overview.data,
              taskAnalytics: taskAnalytics.data,
              productivity: productivity.data,
            })
          }
          return
        }

        const personal = await personalPromise
        if (!cancelled) {
          setData({ ...initialState, personal: personal.data })
        }
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.message || 'Dashboard data could not be loaded')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [activeClub?.id, dashboardKind])

  const personalTasks = useMemo(() => {
    const serviceTasks = data.personal?.myTasks || []
    const merged = new Map<string, Task>()
    serviceTasks.forEach((task) => merged.set(task.id, task))
    tasks.forEach((task) => merged.set(task.id, task))
    return Array.from(merged.values()).sort((a, b) => {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })
  }, [data.personal?.myTasks, tasks])

  const overdueTasks = personalTasks.filter((task) => task.isOverdue)
  const openTasks = personalTasks.filter((task) => task.status !== 'done')
  const completedTasks = personalTasks.filter((task) => task.status === 'done')
  const personalCompletionRate = personalTasks.length > 0 ? (completedTasks.length / personalTasks.length) * 100 : 0

  const pageTitle =
    dashboardKind === 'admin'
      ? 'Admin Dashboard'
      : dashboardKind === 'president'
        ? 'President Dashboard'
        : dashboardKind === 'vicepresident'
          ? 'Vice President Dashboard'
          : dashboardKind === 'secretary'
            ? 'Secretary Dashboard'
            : dashboardKind === 'member'
              ? 'Member Dashboard'
              : 'Dashboard'

  const actionPanel = (
    <div className="space-y-4">
      <div>
          <h2 className="text-xl font-semibold text-foreground">What do I need to do?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your tasks, overdue work, events, and notifications are always shown first.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My Tasks" value={openTasks.length} hint="Open tasks assigned to you" tone="blue" />
        <StatCard label="Overdue" value={overdueTasks.length} hint="Needs attention now" tone="red" />
        <StatCard label="Upcoming Events" value={data.personal?.upcomingEvents.length || 0} hint="Events on your schedule" tone="green" />
        <StatCard label="Notifications" value={unreadCount} hint="Unread updates" tone="amber" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <TaskListCard title="My Tasks" description="Personal task page data, updated instantly when Socket.IO task events arrive." tasks={openTasks} />
        <EventsCard title="Upcoming Events" description="Events relevant to you." events={data.personal?.upcomingEvents || []} />
        <NotificationsCard />
      </div>
    </div>
  )

  const roleContent = () => {
    if (error) {
      return (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-950/20">
          <CardContent className="flex gap-3 py-5">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <p className="text-sm text-rose-700 dark:text-rose-200">{error}</p>
          </CardContent>
        </Card>
      )
    }

    if (isLoading) {
      return <div className="grid grid-cols-1 gap-6 md:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
    }

    if (dashboardKind === 'admin') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Users" value={data.adminOverview?.totalUsers || 0} hint="Registered platform users" tone="blue" />
            <StatCard label="Total Clubs" value={data.adminOverview?.totalClubs || 0} hint="All clubs in the system" tone="green" />
            <StatCard label="Total Tasks" value={data.adminOverview?.totalTasks || 0} hint="All platform tasks" tone="amber" />
            <StatCard label="System Stats" value={data.systemHealth?.apiHealth || 'healthy'} hint="API and database health" tone="slate" />
          </div>
          <AdminTables users={data.adminUsers} clubs={data.adminClubs} tasks={data.adminTasks} logs={data.auditLogs} />
        </div>
      )
    }

    if (dashboardKind === 'president') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Tasks" value={data.overview?.totalTasks || 0} hint="All club tasks" tone="blue" />
            <StatCard label="Completion Rate" value={percent(data.overview?.taskCompletionRate || 0)} hint="Club delivery health" tone="green" />
            <StatCard label="Overdue Tasks" value={data.overview?.overdueTasks || 0} hint="Leadership follow-up needed" tone="red" />
            <StatCard label="Events Summary" value={data.overview?.upcomingEventsCount || 0} hint="Upcoming club events" tone="amber" />
          </div>
          <TaskCharts analytics={data.taskAnalytics} />
          <ProductivityCard productivity={data.productivity} />
        </div>
      )
    }

    if (dashboardKind === 'vicepresident') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Tasks Overview" value={data.overview?.totalTasks || 0} hint="Club task load" tone="blue" />
            <StatCard label="Overdue Tasks" value={data.overview?.overdueTasks || 0} hint="Execution risk" tone="red" />
            <StatCard label="Completed" value={data.overview?.completedTasks || 0} hint="Finished workflow items" tone="green" />
            <StatCard label="Completion Rate" value={percent(data.overview?.taskCompletionRate || 0)} hint="Operational health" tone="amber" />
          </div>
          <TaskCharts analytics={data.taskAnalytics} />
          <ProductivityCard productivity={data.productivity} limited />
        </div>
      )
    }

    if (dashboardKind === 'secretary') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard label="Events Focus" value={data.overview?.upcomingEventsCount || 0} hint="Upcoming club events" tone="green" />
            <StatCard label="Assigned Tasks" value={openTasks.length} hint="Secretary tasks" tone="blue" />
            <StatCard label="Basic Stats" value={data.overview?.totalTasks || 0} hint="Total club tasks" tone="slate" />
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <EventsCard title="Events Focus" description="Event planning, RSVP readiness, and upcoming schedule." events={data.personal?.upcomingEvents || []} />
            <TaskListCard title="Assigned Tasks" description="Your assigned follow-up work." tasks={openTasks} />
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Personal Tasks" value={openTasks.length} hint="Only your assigned tasks" tone="blue" />
          <StatCard label="Overdue" value={overdueTasks.length} hint="Personal overdue tasks" tone="red" />
          <StatCard label="Progress" value={percent(personalCompletionRate)} hint="Your completion rate" tone="green" />
        </div>
        <TaskListCard title="Only Personal Tasks" description="Members only see their own task workload here." tasks={personalTasks} />
      </div>
    )
  }

  return (
    <BaseLayout title={pageTitle}>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
              {dashboardKind === 'admin' ? <Shield className="h-3.5 w-3.5" /> : <FolderKanban className="h-3.5 w-3.5" />}
              {dashboardKind === 'admin' ? 'Admin' : clubRole || 'personal'} view
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">{pageTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {dashboardKind === 'admin'
                ? 'System totals, health, and audit logs.'
                : 'Role-aware dashboard with real-time task and notification updates.'}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-muted-foreground">
            <Bell className="h-5 w-5" />
            <Clock3 className="h-5 w-5" />
            <CalendarClock className="h-5 w-5" />
            {dashboardKind === 'admin' ? <Shield className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
        </div>

        {actionPanel}

        <div className="flex items-center gap-2 border-t border-slate-200/70 pt-6 dark:border-white/10">
          {dashboardKind === 'admin' ? <Shield className="h-5 w-5 text-slate-500" /> : <BarChart3 className="h-5 w-5 text-slate-500" />}
          <h2 className="text-xl font-semibold text-foreground">Role View</h2>
        </div>

        {roleContent()}
      </div>
    </BaseLayout>
  )
}
