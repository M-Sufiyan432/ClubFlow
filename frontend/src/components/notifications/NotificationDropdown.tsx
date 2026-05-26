import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '@/store/slices/notificationSlice'
import { NotificationType } from '@/types/index'
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

const getNotificationIcon = (type: NotificationType) => {
  const iconMap: Record<NotificationType, string> = {
    [NotificationType.TASK_ASSIGNED]: 'TA',
    [NotificationType.TASK_COMPLETED]: 'TC',
    [NotificationType.TASK_DUE_SOON]: 'DS',
    [NotificationType.TASK_OVERDUE]: 'OD',
    [NotificationType.TASK_COMMENTED]: 'CM',
    [NotificationType.EVENT_CREATED]: 'EV',
    [NotificationType.EVENT_REMINDER]: 'ER',
    [NotificationType.MEMBER_ADDED]: 'MA',
    [NotificationType.MEMBER_LEFT]: 'ML',
    [NotificationType.CLUB_UPDATED]: 'CU',
    [NotificationType.RSVP_RESPONSE]: 'RS',
    [NotificationType.SYSTEM]: 'SY',
  }
  return iconMap[type] || 'NT'
}

const getNotificationColor = (type: NotificationType) => {
  const colorMap: Record<NotificationType, string> = {
    [NotificationType.TASK_ASSIGNED]: 'bg-blue-50 text-blue-700 ring-blue-200',
    [NotificationType.TASK_COMPLETED]: 'bg-green-50 text-green-700 ring-green-200',
    [NotificationType.TASK_DUE_SOON]: 'bg-amber-50 text-amber-700 ring-amber-200',
    [NotificationType.TASK_OVERDUE]: 'bg-red-50 text-red-700 ring-red-200',
    [NotificationType.TASK_COMMENTED]: 'bg-violet-50 text-violet-700 ring-violet-200',
    [NotificationType.EVENT_CREATED]: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    [NotificationType.EVENT_REMINDER]: 'bg-orange-50 text-orange-700 ring-orange-200',
    [NotificationType.MEMBER_ADDED]: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    [NotificationType.MEMBER_LEFT]: 'bg-slate-50 text-slate-700 ring-slate-200',
    [NotificationType.CLUB_UPDATED]: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    [NotificationType.RSVP_RESPONSE]: 'bg-pink-50 text-pink-700 ring-pink-200',
    [NotificationType.SYSTEM]: 'bg-slate-50 text-slate-700 ring-slate-200',
  }
  return colorMap[type] || 'bg-slate-50 text-slate-700 ring-slate-200'
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch()
  const { notifications, unreadCount, isFetching } = useAppSelector((state) => state.notifications)
  const [selectedFilter, setSelectedFilter] = useState<NotificationType | 'all'>('all')

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications({ limit: 20 }))
    }
  }, [isOpen, dispatch])

  const filteredNotifications =
    selectedFilter === 'all'
      ? notifications
      : notifications.filter((notification) => notification.type === selectedFilter)

  const handleMarkAsRead = (event: React.MouseEvent, notificationId: string) => {
    event.stopPropagation()
    dispatch(markNotificationAsRead(notificationId))
  }

  const handleDelete = (event: React.MouseEvent, notificationId: string) => {
    event.stopPropagation()
    dispatch(deleteNotification(notificationId))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/20" onClick={onClose} role="presentation">
      <div
        className="absolute right-3 top-16 max-h-[calc(100vh-5rem)] w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-border bg-popover shadow-lg sm:right-6 sm:w-[24rem] lg:right-8"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Notifications"
      >
        <div className="border-b border-border bg-popover p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Notifications</h3>
              <p className="mt-1 text-xs text-muted-foreground">{unreadCount} unread</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close notifications">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2 border-b border-border p-3">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => dispatch(markAllNotificationsAsRead())}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark read
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => {
                if (confirm('Delete all notifications?')) {
                  dispatch(deleteAllNotifications())
                }
              }}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Clear all
            </Button>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto border-b border-border p-3">
          {['all', ...Object.values(NotificationType)].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter as NotificationType | 'all')}
              className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedFilter === filter
                  ? 'border-primary/20 bg-primary/10 text-primary'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter === 'all' ? 'All' : filter.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="max-h-[24rem] overflow-y-auto">
          {isFetching && notifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group p-3 transition-colors hover:bg-secondary/70 ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ring-1 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-tight ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      {!notification.isRead && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(event) => handleMarkAsRead(event, notification.id)}
                          aria-label="Mark notification as read"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(event) => handleDelete(event, notification.id)}
                        aria-label="Delete notification"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
