# Notification System Documentation

## Overview

The notification system is a real-time, comprehensive solution for managing user notifications throughout ClubFlow. It includes real-time updates via Socket.IO, persistent storage via Redux, and an elegant UI for viewing and managing notifications.

## Architecture

### Components

1. **NotificationDropdown** (`/src/components/notifications/NotificationDropdown.tsx`)
   - Dropdown panel in the navbar showing recent notifications
   - Filter by notification type
   - Mark as read / Mark all as read
   - Delete individual or all notifications

2. **NotificationBadge** (`/src/components/notifications/NotificationBadge.tsx`)
   - Badge showing unread count in navbar
   - Auto-hides when unread count is 0
   - Supports count overflow (99+)

3. **Notifications Page** (`/src/pages/Notifications.tsx`)
   - Full-page view of all notifications
   - Advanced filtering by type and read status
   - Detailed notification display with timestamps
   - Bulk actions (mark all read, delete all)

### State Management

**Redux Slice: `notificationSlice.ts`**
- `notifications[]` - Array of all notifications
- `unreadCount` - Real-time count of unread notifications
- `isLoading` / `isFetching` - Loading states
- `filter` - Active filter state

**Async Thunks:**
- `fetchNotifications()` - Get notifications from API
- `getUnreadCount()` - Fetch unread count
- `markNotificationAsRead()` - Mark single notification as read
- `markAllNotificationsAsRead()` - Mark all as read
- `deleteNotification()` - Delete single notification
- `deleteAllNotifications()` - Delete all notifications

### API Integration

**Service: `notificationsService.ts`**
- `GET /api/notifications` - List all notifications with pagination
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications` - Delete all
- `GET /api/notifications/unread-count` - Get unread count

## Real-Time Updates via Socket.IO

### Socket Event: `notificationCreated`

When the server emits a `notificationCreated` event:

```typescript
socket.on('notificationCreated', (notification: Notification) => {
  // 1. Add to Redux notification store
  dispatch(addNotificationFromSocket(notification))
  // 2. Show toast notification to user
  dispatch(showNotification(...))
})
```

**Payload Structure:**
```typescript
interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  description?: string
  isRead: boolean
  actionUrl?: string
  createdAt: string
  relatedUser?: {
    id: string
    name: string
    avatar?: string
  }
}
```

### Notification Types

```typescript
enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
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
```

## Features

### 1. Real-Time Notifications
- Socket.IO integration for instant updates
- Automatic unread count tracking
- Visual indicators for unread notifications
- Toast notifications for immediate feedback

### 2. Unread Count Management
- Redux store maintains current unread count
- Auto-decrements when notification marked as read
- Auto-increments when new notification received
- Badge displays count in navbar (99+ format)

### 3. Notification Filtering
- Filter by type (task, event, member, system, etc.)
- Filter by read status (read/unread)
- Advanced search via API parameters
- Real-time filter updates

### 4. Actions
- **Mark as Read**: Single notification or all at once
- **Delete**: Single notification or all at once
- **View**: Full notification details with timestamps
- **Navigate**: Optional action URL for quick navigation

### 5. UI Enhancements
- Color-coded notification types
- Emoji icons for quick visual identification
- Relative timestamps (e.g., "2 minutes ago")
- Hover actions on notification items
- Responsive design for mobile/desktop

## Usage Examples

### Display Unread Count in Navbar
```tsx
import { useAppSelector } from '@/store/hooks'
import { NotificationBadge } from '@/components/notifications/NotificationBadge'

const Component = () => {
  const { unreadCount } = useAppSelector((state) => state.notifications)
  
  return (
    <div className="relative">
      <Bell className="h-5 w-5" />
      <NotificationBadge />
    </div>
  )
}
```

### Fetch and Display Notifications
```tsx
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchNotifications } from '@/store/slices/notificationSlice'

const Component = () => {
  const dispatch = useAppDispatch()
  const { notifications, isLoading } = useAppSelector((state) => state.notifications)
  
  useEffect(() => {
    dispatch(fetchNotifications({ limit: 20 }))
  }, [dispatch])
  
  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.id}>
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  )
}
```

### Mark Notifications as Read
```tsx
import { useAppDispatch } from '@/store/hooks'
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/store/slices/notificationSlice'

const Component = () => {
  const dispatch = useAppDispatch()
  
  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markNotificationAsRead(notificationId))
  }
  
  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead())
  }
  
  return (
    <>
      <button onClick={() => handleMarkAsRead('123')}>Mark Read</button>
      <button onClick={handleMarkAllAsRead}>Mark All Read</button>
    </>
  )
}
```

## Integration with Socket.IO

The notification system is fully integrated with Socket.IO for real-time updates. When a backend event occurs:

1. Server emits `notificationCreated` event to client
2. Socket listener dispatches `addNotificationFromSocket` action
3. Redux updates notification list and unread count
4. UI automatically updates with new notification
5. Toast notification appears to user

## Backend Integration Checklist

- [ ] Emit `notificationCreated` event on Socket.IO when notifications are created
- [ ] Implement `/api/notifications` endpoint
- [ ] Implement `/api/notifications/:id/read` endpoint
- [ ] Implement `/api/notifications/read-all` endpoint
- [ ] Implement `/api/notifications/:id` (delete) endpoint
- [ ] Implement `/api/notifications` (delete all) endpoint
- [ ] Implement `/api/notifications/unread-count` endpoint
- [ ] Support filtering by type and read status
- [ ] Validate user permissions (only user's notifications)
- [ ] Track notification read status in database

## Performance Optimization

1. **Lazy Loading**: Load notifications on demand
2. **Pagination**: API supports limit/offset for large datasets
3. **Deduplication**: Socket.IO prevents duplicate processing
4. **Memoization**: React components use memo where applicable
5. **Virtual Scrolling**: Can be added for 1000+ notifications

## Error Handling

- Network errors show user-friendly messages
- Failed API calls automatically retry
- Socket disconnection gracefully degrades to polling
- Invalid permissions handled via 403 Forbidden

## Security Considerations

- Users can only see their own notifications
- Backend validates user permissions
- No sensitive data in notification messages
- Token-based Socket.IO authentication
