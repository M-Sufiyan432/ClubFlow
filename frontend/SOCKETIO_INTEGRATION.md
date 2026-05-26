# Socket.IO Integration for ClubFlow

## Overview

Socket.IO is fully integrated into ClubFlow frontend for real-time updates. The system handles task updates, comments, and notifications with automatic reconnection and duplicate prevention.

## Architecture

### Connection Flow

1. **Authentication** → User logs in, token is obtained
2. **Socket Initialization** → `useSocketIO` hook initializes socket after authentication
3. **Room Joining** → Socket joins the active club room using `activeClubId`
4. **Event Listening** → Backend events trigger Redux updates and toast notifications

### Event Types

#### Task Events
- **taskCreated**: New task created by another user
- **taskUpdated**: Existing task modified (status, priority, assignees, etc.)

#### Comment Events
- **commentAdded**: New comment added to a task

#### Notification Events
- **notificationCreated**: General notifications from backend

## Key Features

### 1. Duplicate Prevention
- Event IDs are tracked using `processedEventIds` Set
- Prevents duplicate updates from network retries or re-connections
- Automatically manages cache size (max 100 events)

### 2. Automatic Reconnection
- Reconnection delay: 1000ms initial, up to 5000ms max
- Maximum 5 reconnection attempts
- Falls back to polling if WebSocket unavailable

### 3. Room Management
- Automatically joins club room when `activeClub` changes
- Leaves room when switching clubs
- Maintains separate event streams per club

### 4. State Management
- Redux integration with `updateTaskFromSocket` and `addCommentFromSocket`
- Optimistic updates for immediate UI feedback
- Automatic rollback on error

### 5. Notifications
- Toast notifications for all socket events
- Auto-dismiss after 3 seconds
- Color-coded by type (success, error, info, warning)

## Usage

### Basic Socket.IO Hook

```tsx
import { useSocketIO } from '@/hooks/useSocketIO'

function MyComponent() {
  const { isConnected, clubId } = useSocketIO()
  
  return <div>{isConnected ? 'Connected' : 'Disconnected'}</div>
}
```

### Emitting Events

```tsx
import { emitEvent } from '@/services/socket'

emitEvent('task_complete', { taskId: '123' })
```

### Listening to Events

```tsx
import { onEvent, offEvent } from '@/services/socket'

// Subscribe
onEvent('taskUpdated', (payload) => {
  console.log('Task updated:', payload)
})

// Unsubscribe
offEvent('taskUpdated')
```

## Redux Integration

### Socket Event Handlers in Task Slice

```typescript
updateTaskFromSocket(state, action)
```
Updates a task in the store when socket receives `taskUpdated` event.

```typescript
addCommentFromSocket(state, action)
```
Adds a comment to a task when socket receives `commentAdded` event.

## Lifecycle Management

### Connection Lifecycle

```
App Load
  ↓
verifySession (auth check)
  ↓
useSocketIO Hook
  ↓
initializeSocket (after auth)
  ↓
Join Club Room (when activeClub changes)
  ↓
Listen to Events
  ↓
User Changes Club (leave room, join new room)
  ↓
User Logs Out (disconnect socket, cleanup)
```

### Cleanup on Logout

1. `logoutAsync` thunk removes auth state
2. `isAuthenticated` becomes false
3. AppContent useEffect triggers `disconnectSocket()`
4. Socket disconnects and `processedEventIds` clears

## Configuration

### Socket Options

```typescript
{
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
}
```

### Environment Variables

Set in `.env`:

```
VITE_SOCKET_URL=http://localhost:3001
```

## Debugging

### Enable Logging

The system uses `console.log` with `[Socket]` prefix:

```
[Socket] Connected to server with ID: abc123
[Socket] Task updated: { id: 'task1', title: 'New Title' }
[Socket] Joining club room: club_456
```

### Checking Connection Status

```tsx
import { getSocket } from '@/services/socket'

const socket = getSocket()
console.log('Connected:', socket?.connected)
console.log('Socket ID:', socket?.id)
```

### Clear Processed Events (Testing)

```tsx
import { clearProcessedEvents } from '@/services/socket'

clearProcessedEvents()
```

## Error Handling

### Connection Errors

- Automatically shown in toast notifications
- Automatic reconnection attempts
- User is notified if multiple reconnection failures

### Room Join Errors

- `room_join_error` event triggers error toast
- User must manually refresh or switch clubs
- Backend logs indicate root cause

### Event Processing Errors

- Caught and logged in console
- Redux state not updated on error
- UI remains consistent

## Performance Considerations

1. **Event Deduplication**: Prevents unnecessary Redux updates
2. **Lazy Loading**: Socket only connects after authentication
3. **Room Separation**: Each club has its own event stream
4. **Auto-disconnect**: Cleanup on logout prevents memory leaks
5. **Cache Management**: Processed event IDs limited to 100 entries

## Testing

### Mock Socket Events

For testing without backend:

```tsx
import { getSocket } from '@/services/socket'

const socket = getSocket()
socket?.emit('taskUpdated', {
  id: 'unique-event-id-123',
  taskId: 'task-1',
  title: 'Updated Task',
  status: 'in_progress',
  timestamp: new Date().toISOString(),
})
```

### Simulate Disconnection

```tsx
const socket = getSocket()
socket?.disconnect()
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Not receiving events | Check if socket is connected: `getSocket()?.connected` |
| Duplicate updates | Event deduplication should prevent this. Check event IDs are unique |
| Reconnection failing | Verify backend is running and VITE_SOCKET_URL is correct |
| Toast not showing | Ensure Toast component is rendered in App.tsx |
| Memory leak on logout | Verify `disconnectSocket()` is called in cleanup |

## Backend Requirements

Backend must emit events with this structure:

```javascript
socket.emit('taskUpdated', {
  id: 'unique-event-id',           // Required for deduplication
  timestamp: '2024-01-01T00:00:00Z', // ISO string
  taskId: '123',
  title: 'Task Title',
  status: 'in_progress',
  priority: 'high',
  // ... other task fields
})
```

## Next Steps

- Add presence indicators (who's online)
- Implement real-time cursor positions
- Add activity feed with socket events
- Implement typing indicators
- Add collaborative editing
