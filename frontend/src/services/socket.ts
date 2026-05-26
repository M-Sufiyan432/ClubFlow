import { io, Socket } from 'socket.io-client'
import { SOCKET_URL } from '@/utils/config'
import { store } from '@/store/store'
import { addTaskFromSocket, updateTaskFromSocket, addCommentFromSocket, removeTaskFromSocket } from '@/store/slices/taskSlice'
import { showNotification } from '@/store/slices/uiSlice'
import { addNotificationFromSocket } from '@/store/slices/notificationSlice'
import { Notification } from '@/types/index'
import { mapTask, mapTaskComment } from './adapters'

let socket: Socket | null = null
const processedEventIds = new Set<string>()
const MAX_PROCESSED_IDS = 100
const managerRoles = new Set(['president', 'vicepresident', 'secretary'])
const adminRoles = new Set(['admin', 'superadmin', 'super_admin'])

export interface SocketEventPayload {
  id: string
  timestamp: string
  [key: string]: any
}

export const initializeSocket = (token: string, clubId?: string) => {
  if (socket?.connected) {
    console.log('[Socket] Already connected, joining room:', clubId)
    if (clubId) {
      socket.emit('join_club', { clubId })
    }
    return socket
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: `Bearer ${token}`,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  })

  // Connection events
  socket.on('connect', () => {
    console.log('[Socket] Connected to server with ID:', socket?.id)
    if (clubId) {
      socket?.emit('join_club', { clubId })
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected from server:', reason)
    // Clear processed IDs on disconnect to allow fresh syncing
    if (reason === 'io server disconnect' || reason === 'io client namespace disconnect') {
      processedEventIds.clear()
    }
  })

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error)
    store.dispatch(
      showNotification({
        message: 'Connection error. Attempting to reconnect...',
        type: 'warning',
      })
    )
  })

  // Task events
  const handleTaskCreated = (payload: SocketEventPayload) => {
    if (isDuplicateEvent(payload.id)) return

    console.log('[Socket] Task created:', payload)
    const task = mapTask(payload)
    if (canSeeTaskFromSocket(task)) {
      store.dispatch(addTaskFromSocket(task))
    }
    store.dispatch(
      showNotification({
        message: `New task created: ${task.title}`,
        type: 'info',
      })
    )
  }

  socket.on('taskCreated', handleTaskCreated)
  socket.on('task_created', handleTaskCreated)

  const handleTaskUpdated = (payload: SocketEventPayload) => {
    if (isDuplicateEvent(payload.id)) return

    console.log('[Socket] Task updated:', payload)
    const task = mapTask(payload)
    if (canSeeTaskFromSocket(task)) {
      store.dispatch(addTaskFromSocket(task))
      store.dispatch(updateTaskFromSocket(task))
    } else {
      store.dispatch(removeTaskFromSocket({ taskId: task.id }))
    }
    store.dispatch(
      showNotification({
        message: `Task updated: ${task.title}`,
        type: 'info',
      })
    )
  }

  socket.on('taskUpdated', handleTaskUpdated)
  socket.on('task_updated', handleTaskUpdated)
  socket.on('task_status_updated', handleTaskUpdated)
  socket.on('task_assigned', handleTaskUpdated)

  const handleTaskDeleted = (payload: SocketEventPayload & { taskId?: string }) => {
    const taskId = payload.taskId || payload.id
    if (isDuplicateEvent(taskId)) return

    store.dispatch(removeTaskFromSocket({ taskId }))
    store.dispatch(
      showNotification({
        message: 'Task archived',
        type: 'info',
      })
    )
  }

  socket.on('taskDeleted', handleTaskDeleted)
  socket.on('task_deleted', handleTaskDeleted)

  // Comment events
  const handleCommentAdded = (payload: SocketEventPayload) => {
    if (isDuplicateEvent(payload.id)) return

    console.log('[Socket] Comment added:', payload)
    store.dispatch(addCommentFromSocket({ ...mapTaskComment(payload.comment), taskId: payload.taskId }))
    store.dispatch(
      showNotification({
        message: `New comment on ${payload.taskTitle}`,
        type: 'info',
      })
    )
  }

  socket.on('commentAdded', handleCommentAdded)
  socket.on('comment_added', handleCommentAdded)

  // Notification events
  socket.on('notificationCreated', (payload: Notification) => {
    if (isDuplicateEvent(payload.id)) return

    console.log('[Socket] Notification created:', payload)
    // Add to Redux notification store
    store.dispatch(addNotificationFromSocket(payload))
    // Show toast notification
    store.dispatch(
      showNotification({
        message: payload.title,
        type: 'info',
      })
    )
  })

  // Room join confirmation
  socket.on('room_joined', (data) => {
    console.log('[Socket] Successfully joined room:', data.clubId)
  })

  socket.on('room_join_error', (error) => {
    console.error('[Socket] Failed to join room:', error)
    store.dispatch(
      showNotification({
        message: 'Failed to join club room',
        type: 'error',
      })
    )
  })

  return socket
}

/**
 * Prevent duplicate event processing
 * Uses event ID and timestamp to track processed events
 */
const isDuplicateEvent = (eventId: string): boolean => {
  if (processedEventIds.has(eventId)) {
    return true
  }

  processedEventIds.add(eventId)

  // Keep set size manageable
  if (processedEventIds.size > MAX_PROCESSED_IDS) {
    const idsArray = Array.from(processedEventIds)
    const toDelete = idsArray.slice(0, MAX_PROCESSED_IDS / 2)
    toDelete.forEach((id) => processedEventIds.delete(id))
  }

  return false
}

const canSeeTaskFromSocket = (task: ReturnType<typeof mapTask>): boolean => {
  const state = store.getState()
  const user = state.auth.user

  if (!user) return false
  if (user.roles?.some((role: string) => adminRoles.has(role)) || (user.role && adminRoles.has(user.role))) {
    return true
  }

  const clubRole = user.clubs?.find((membership: any) => {
    const club = membership.club
    const clubId = typeof club === 'string' ? club : club?.id || club?._id
    return clubId === task.clubId
  })?.role

  return (
    managerRoles.has(clubRole || '') ||
    task.createdBy.id === user.id ||
    task.assignees.some((assignee) => assignee.id === user.id)
  )
}

export const getSocket = (): Socket | null => {
  return socket
}

export const joinClubRoom = (clubId: string) => {
  if (socket?.connected) {
    socket.emit('join_club', { clubId })
    console.log('[Socket] Joining club room:', clubId)
  }
}

export const leaveClubRoom = (clubId: string) => {
  if (socket?.connected) {
    socket.emit('leave_club', { clubId })
    console.log('[Socket] Leaving club room:', clubId)
  }
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    processedEventIds.clear()
    console.log('[Socket] Socket disconnected and cleaned up')
  }
}

export const emitEvent = (event: string, data?: any) => {
  if (socket?.connected) {
    socket.emit(event, data)
  } else {
    console.warn('[Socket] Cannot emit event, socket not connected:', event)
  }
}

export const onEvent = (event: string, callback: (data: any) => void) => {
  if (socket) {
    socket.on(event, callback)
  }
}

export const offEvent = (event: string, callback?: (data: any) => void) => {
  if (socket) {
    socket.off(event, callback)
  }
}

/**
 * Clear processed event IDs (useful for testing or manual cache clear)
 */
export const clearProcessedEvents = () => {
  processedEventIds.clear()
}
