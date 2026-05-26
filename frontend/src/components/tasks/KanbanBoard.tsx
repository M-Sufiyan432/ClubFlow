import React, { useState } from 'react'
import { Task, TaskStatus } from '@/types/index'
import { Plus } from 'lucide-react'
import { TaskCard } from './TaskCard'

interface KanbanBoardProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onCreateTask?: () => void
  canCreateTask?: boolean
  isLoading?: boolean
}

const COLUMNS = [
  { status: TaskStatus.TODO, label: 'To Do' },
  { status: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { status: TaskStatus.IN_REVIEW, label: 'In Review' },
  { status: TaskStatus.DONE, label: 'Done' },
]

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onStatusChange,
  onCreateTask,
  canCreateTask = false,
  isLoading,
}) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== status) {
      onStatusChange(draggedTask.id, status)
    }
    setDraggedTask(null)
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map(column => {
        const columnTasks = tasks.filter(t => t.status === column.status)
        return (
          <div
            key={column.status}
            className="flex min-w-0 flex-col rounded-lg border border-border bg-secondary/55 p-3"
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, column.status)}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{column.label}</h3>
              <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {columnTasks.length}
              </span>
            </div>

            <div className="min-h-[18rem] flex-1 space-y-2">
              {columnTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  draggable={!isLoading}
                  onDragStart={handleDragStart}
                  onClick={onTaskClick}
                />
              ))}

              {columnTasks.length === 0 && (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-card/60 text-muted-foreground">
                  <p className="text-sm">No tasks</p>
                </div>
              )}

              {canCreateTask && column.status === TaskStatus.TODO && (
                <button
                  type="button"
                  onClick={onCreateTask}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                  Add task
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
