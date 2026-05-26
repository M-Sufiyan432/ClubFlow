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
import { Check, CheckCheck, Trash2, Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const getNotificationInitials = (type: NotificationType) => {
  const words = type.replace(/_/g, ' ').split(' ')
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('')
}

export const Notifications: React.FC = () => {
  const dispatch = useAppDispatch()
  const { notifications, unreadCount, isFetching } = useAppSelector((state) => state.notifications)
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
        ? notifications.filter((notification) => !notification.isRead)
        : notifications.filter((notification) => notification.type === selectedFilter)

  const filters = [
    { label: 'All', value: 'all' as const },
    { label: 'Unread', value: 'unread' as const },
    ...Object.values(NotificationType).map((value) => ({
      label: value.replace(/_/g, ' '),
      value,
    })),
  ]

  return (
    <BaseLayout title="Notifications">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">Notifications</h1>
            <p className="mt-2 text-sm text-muted-foreground">{unreadCount} unread notifications</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => dispatch(markAllNotificationsAsRead())}
              disabled={unreadCount === 0}
              size="sm"
              className="w-full sm:w-auto"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
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
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete all
            </Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((filterItem) => (
            <Button
              key={filterItem.value}
              onClick={() => handleFilterChange(filterItem.value)}
              variant={selectedFilter === filterItem.value ? 'default' : 'outline'}
              size="sm"
              className="shrink-0 capitalize"
            >
              {filterItem.label}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {isFetching && notifications.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-medium">No notifications found</p>
                <p className="mt-1 text-sm text-muted-foreground">Updates will appear here when there is activity.</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-colors ${!notification.isRead ? 'border-primary/25 bg-primary/5' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-xs font-semibold text-muted-foreground">
                      {getNotificationInitials(notification.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                        {!notification.isRead && <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border border-border bg-secondary px-2 py-0.5 capitalize">
                          {notification.type.replace(/_/g, ' ')}
                        </span>
                        <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:self-start">
                      {!notification.isRead && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => dispatch(markNotificationAsRead(notification.id))}
                          aria-label="Mark notification as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => dispatch(deleteNotification(notification.id))}
                        aria-label="Delete notification"
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
