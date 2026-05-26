import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  setFilter,
  clearFilter,
} from '@/store/slices/notificationSlice'
import { NotificationType } from '@/types/index'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, CheckCheck, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const getNotificationIcon = (type: NotificationType) => {
  const iconMap: Record<NotificationType, string> = {
    [NotificationType.TASK_ASSIGNED]: '📋',
    [NotificationType.TASK_COMPLETED]: '✅',
    [NotificationType.TASK_DUE_SOON]: '⏰',
    [NotificationType.TASK_OVERDUE]: '⚠️',
    [NotificationType.TASK_COMMENTED]: '💬',
    [NotificationType.EVENT_CREATED]: '📅',
    [NotificationType.EVENT_REMINDER]: '🔔',
    [NotificationType.MEMBER_ADDED]: '👤',
    [NotificationType.MEMBER_LEFT]: '👋',
    [NotificationType.CLUB_UPDATED]: '🏢',
    [NotificationType.RSVP_RESPONSE]: '✋',
    [NotificationType.SYSTEM]: '⚙️',
  }
  return iconMap[type] || '📬'
}

const getNotificationColor = (type: NotificationType) => {
  const colorMap: Record<NotificationType, string> = {
    [NotificationType.TASK_ASSIGNED]: 'from-blue-100 to-blue-50',
    [NotificationType.TASK_COMPLETED]: 'from-green-100 to-green-50',
    [NotificationType.TASK_DUE_SOON]: 'from-amber-100 to-amber-50',
    [NotificationType.TASK_OVERDUE]: 'from-red-100 to-red-50',
    [NotificationType.TASK_COMMENTED]: 'from-purple-100 to-purple-50',
    [NotificationType.EVENT_CREATED]: 'from-cyan-100 to-cyan-50',
    [NotificationType.EVENT_REMINDER]: 'from-orange-100 to-orange-50',
    [NotificationType.MEMBER_ADDED]: 'from-emerald-100 to-emerald-50',
    [NotificationType.MEMBER_LEFT]: 'from-slate-100 to-slate-50',
    [NotificationType.CLUB_UPDATED]: 'from-indigo-100 to-indigo-50',
    [NotificationType.RSVP_RESPONSE]: 'from-pink-100 to-pink-50',
    [NotificationType.SYSTEM]: 'from-gray-100 to-gray-50',
  }
  return colorMap[type] || 'from-gray-100 to-gray-50'
}

export const Notifications: React.FC = () => {
  const dispatch = useAppDispatch()
  const { notifications, unreadCount, isFetching, filter } = useAppSelector((state) => state.notifications)
  const [selectedFilter, setSelectedFilter] = useState<NotificationType | 'all' | 'unread'>('all')

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 50 }))
  }, [dispatch])

  const handleFilterChange = (newFilter: NotificationType | 'all' | 'unread') => {
    setSelectedFilter(newFilter)
    if (newFilter === 'all') {
      dispatch(clearFilter())
    } else if (newFilter === 'unread') {
      dispatch(setFilter({ isRead: false }))
    } else {
      dispatch(setFilter({ type: newFilter }))
    }
  }

  const filteredNotifications =
    selectedFilter === 'all'
      ? notifications
      : selectedFilter === 'unread'
        ? notifications.filter((n) => !n.isRead)
        : notifications.filter((n) => n.type === selectedFilter)

  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markNotificationAsRead(notificationId))
  }

  const handleDelete = (notificationId: string) => {
    dispatch(deleteNotification(notificationId))
  }

  return (
    <BaseLayout title="Notifications">
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-2">{unreadCount} unread notifications</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => dispatch(markAllNotificationsAsRead())}
          disabled={unreadCount === 0}
          size="sm"
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Mark all read
        </Button>
        <Button
          onClick={() => {
            if (confirm('Delete all notifications?')) {
              dispatch(deleteAllNotifications())
            }
          }}
          variant="destructive"
          size="sm"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete all
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { label: 'All', value: 'all' as const },
          { label: 'Unread', value: 'unread' as const },
          ...Object.entries(NotificationType).map(([_, value]) => ({
            label: value.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            value: value as NotificationType,
          })),
        ].map((filter) => (
          <Button
            key={filter.value}
            onClick={() => handleFilterChange(filter.value as any)}
            variant={selectedFilter === filter.value ? 'default' : 'outline'}
            size="sm"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isFetching && notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center py-8">Loading notifications...</p>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center py-8">No notifications found</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`overflow-hidden transition-all ${!notification.isRead ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <div className={`h-1 bg-gradient-to-r ${getNotificationColor(notification.type)}`} />
              <CardContent className="pt-4">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      </div>
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-primary mt-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="inline-block px-2 py-1 bg-secondary rounded text-xs">
                        {notification.type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(notification.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
    </BaseLayout>
  )
}
