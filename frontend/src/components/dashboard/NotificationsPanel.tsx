import React from 'react'
import { useAppDispatch } from '@/store/hooks'
import { markNotificationAsRead, deleteNotification, markAllNotificationsAsRead } from '@/store/slices/analyticsSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardNotification } from '@/types/index'
import { Trash2, CheckSquare2, AlertCircle, Info, CheckCircle2, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface NotificationsPanelProps {
  notifications: DashboardNotification[]
  isLoading: boolean
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, isLoading }) => {
  const dispatch = useAppDispatch()

  const handleMarkAsRead = async (id: string) => {
    await dispatch(markNotificationAsRead(id))
  }

  const handleDelete = async (id: string) => {
    await dispatch(deleteNotification(id))
  }

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllNotificationsAsRead())
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getIcon = (type: DashboardNotification['type']) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="h-4 w-4" />
      case 'event':
        return <Calendar className="h-4 w-4" />
      case 'member':
        return <Info className="h-4 w-4" />
      case 'system':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500'
      case 'medium':
        return 'border-l-amber-500'
      case 'low':
        return 'border-l-blue-500'
      default:
        return 'border-l-slate-400'
    }
  }

  const getTypeColor = (type: DashboardNotification['type']) => {
    switch (type) {
      case 'task':
        return 'bg-blue-50 text-blue-700'
      case 'event':
        return 'bg-green-50 text-green-700'
      case 'member':
        return 'bg-violet-50 text-violet-700'
      case 'system':
        return 'bg-amber-50 text-amber-700'
      default:
        return 'bg-slate-50 text-slate-700'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </CardDescription>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs"
          >
            <CheckSquare2 className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No notifications</p>
          </div>
        ) : (
          <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-l-4 ${getPriorityColor(
                  notification.priority
                )} rounded-lg border-y border-r border-border bg-card p-3 transition-colors hover:bg-secondary/60 ${
                  !notification.isRead ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <div className={`mt-0.5 rounded-md p-1.5 ${getTypeColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                        aria-label="Mark notification as read"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(notification.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
