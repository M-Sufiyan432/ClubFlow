# Task Management System - Quick Start Guide

## Accessing Tasks

1. Navigate to `/tasks` route (or click Tasks in Sidebar)
2. Ensure a club is selected (set via `activeClub` in Redux)
3. Tasks load automatically via `fetchTasks` thunk

## Creating a Task

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { createTask } from '@/store/slices/taskSlice'
import { CreateTaskRequest, TaskPriority } from '@/types/index'

const handleCreate = async (formData: CreateTaskRequest) => {
  const activeClubId = useAppSelector(state => state.clubs.activeClub?.id)
  
  await dispatch(createTask({
    clubId: activeClubId,
    data: {
      title: 'New Task',
      description: 'Task description',
      priority: TaskPriority.HIGH,
      dueDate: '2024-12-31',
      assigneeIds: ['user1', 'user2'],
      tags: ['bug', 'urgent']
    }
  })).unwrap()
}
```

## Changing Task Status

```typescript
import { updateTaskStatus, optimisticTaskStatusUpdate } from '@/store/slices/taskSlice'
import { TaskStatus } from '@/types/index'

// Optimistic update (immediate UI change)
dispatch(optimisticTaskStatusUpdate({ 
  taskId: 'task-id', 
  status: TaskStatus.IN_PROGRESS 
}))

// API update
await dispatch(updateTaskStatus({
  clubId: activeClubId,
  taskId: 'task-id',
  status: TaskStatus.IN_PROGRESS
})).unwrap()
```

## Adding Comments

```typescript
import { addComment } from '@/store/slices/taskSlice'

await dispatch(addComment({
  clubId: activeClubId,
  taskId: 'task-id',
  content: 'This is a comment'
})).unwrap()
```

## Viewing Different Task Views

- **Kanban**: Drag tasks between columns for status changes
- **List**: Detailed view with all task information
- **Calendar**: Due date visualization by month

## Component Props

### KanbanBoard
```typescript
interface KanbanBoardProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onCreateTask: () => void
  isLoading?: boolean
}
```

### TaskListView
```typescript
interface TaskListViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  isLoading?: boolean
}
```

### TaskCalendarView
```typescript
interface TaskCalendarViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  isLoading?: boolean
}
```

## Redux Hooks

```typescript
// Get task state
const { tasks, currentTask, isLoading, error } = useAppSelector(
  state => state.tasks
)

// Dispatch actions
const dispatch = useAppDispatch()

// Typical pattern
useEffect(() => {
  dispatch(fetchTasks({ clubId: activeClubId }))
}, [activeClubId, dispatch])
```

## Error Handling

```typescript
try {
  await dispatch(createTask({
    clubId: activeClubId,
    data: taskData
  })).unwrap()
} catch (error) {
  // Error automatically stored in state.tasks.error
  console.error('Task creation failed:', error)
}
```

## Task Status Workflow

```
TODO → IN_PROGRESS → IN_REVIEW → DONE (or ARCHIVED)
```

## Task Priority Levels

- **URGENT** - Immediate attention required (red)
- **HIGH** - Important, do soon (orange)
- **MEDIUM** - Normal priority (yellow)
- **LOW** - Can wait (green)

## Common Patterns

### Load tasks for a club
```typescript
dispatch(fetchTasks({ clubId: 'club-id' }))
```

### Filter tasks
```typescript
dispatch(setFilter({
  status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
  priority: [TaskPriority.HIGH, TaskPriority.URGENT],
  assignees: ['user-id']
}))
```

### Get task with comments
```typescript
dispatch(fetchTaskDetail({ clubId: activeClubId, taskId: 'task-id' }))
dispatch(fetchComments({ clubId: activeClubId, taskId: 'task-id' }))
```

### Delete a task
```typescript
await dispatch(deleteTask({
  clubId: activeClubId,
  taskId: 'task-id'
})).unwrap()
```

## Tips & Tricks

1. **Optimistic updates** make the UI feel responsive
2. **Task modal** auto-loads when you select a task
3. **Drag-and-drop** in Kanban view changes status automatically
4. **Calendar view** shows only tasks with due dates
5. **Comments** are loaded on demand when opening task detail

## Debugging

Enable Redux DevTools to:
- Inspect current task state
- Time-travel through actions
- Check dispatched actions
- Monitor state changes

## API Requirements

Backend must implement these endpoints:
- `GET /api/clubs/{clubId}/tasks`
- `POST /api/clubs/{clubId}/tasks`
- `GET /api/clubs/{clubId}/tasks/{taskId}`
- `PUT /api/clubs/{clubId}/tasks/{taskId}`
- `DELETE /api/clubs/{clubId}/tasks/{taskId}`
- `PATCH /api/clubs/{clubId}/tasks/{taskId}/status`
- `POST /api/clubs/{clubId}/tasks/{taskId}/comments`
- `GET /api/clubs/{clubId}/tasks/{taskId}/comments`
- `POST /api/clubs/{clubId}/tasks/{taskId}/assign`

All responses should follow the standard format:
```json
{ "success": true, "data": {...}, "message": "..." }
```
