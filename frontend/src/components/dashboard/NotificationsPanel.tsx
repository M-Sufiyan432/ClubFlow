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
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-blue-500'
      default:
        return 'border-l-gray-500'
    }
  }

  const getTypeColor = (type: DashboardNotification['type']) => {
    switch (type) {
      case 'task':
        return 'bg-blue-50 text-blue-600'
      case 'event':
        return 'bg-green-50 text-green-600'
      case 'member':
        return 'bg-purple-50 text-purple-600'
      case 'system':
        return 'bg-yellow-50 text-yellow-600'
      default:
        return 'bg-gray-50 text-gray-600'
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
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
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
          <div className="text-center py-8 text-muted-foreground">
            <p>No notifications</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-l-4 ${getPriorityColor(
                  notification.priority
                )} rounded-lg p-3 transition-all hover:bg-muted/50 ${
                  !notification.isRead ? 'bg-muted/30' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <div className={`mt-0.5 p-1.5 rounded ${getTypeColor(notification.type)}`}>
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
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                        className="h-8 w-8 p-0"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      title="Delete"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
