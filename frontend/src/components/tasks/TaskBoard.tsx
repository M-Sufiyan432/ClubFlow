import React from 'react'
import { Task, TaskStatus } from '@/types/index'
import { KanbanBoard } from './KanbanBoard'

interface TaskBoardProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onCreateTask?: () => void
  canCreateTask?: boolean
  isLoading?: boolean
}

export const TaskBoard: React.FC<TaskBoardProps> = (props) => <KanbanBoard {...props} />

