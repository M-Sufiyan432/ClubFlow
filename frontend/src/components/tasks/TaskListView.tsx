import React from 'react'
import { Task, TaskStatus } from '@/types/index'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, ChevronRight, Clock3, Layers3, Repeat2 } from 'lucide-react'

interface TaskListViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600'
    case 'high':
      return 'text-orange-600'
    case 'medium':
      return 'text-amber-600'
    case 'low':
      return 'text-green-600'
    default:
      return 'text-gray-600'
  }
}

const getStatusBadge = (status: TaskStatus) => {
  const statusMap = {
    [TaskStatus.TODO]: 'border-border bg-secondary text-muted-foreground',
    [TaskStatus.IN_PROGRESS]: 'border-blue-200 bg-blue-50 text-blue-700',
    [TaskStatus.IN_REVIEW]: 'border-violet-200 bg-violet-50 text-violet-700',
    [TaskStatus.DONE]: 'border-green-200 bg-green-50 text-green-700',
    [TaskStatus.ARCHIVED]: 'border-border bg-secondary text-muted-foreground',
  }
  return statusMap[status] || 'border-border bg-secondary text-muted-foreground'
}

export const TaskListView: React.FC<TaskListViewProps> = ({ tasks, onTaskClick }) => {
  return (
    <div className="min-w-0 space-y-2">
      {tasks.length === 0 ? (
        <Card className="border-dashed p-8 text-center">
          <p className="text-sm font-medium">No tasks found</p>
          <p className="mt-1 text-sm text-muted-foreground">Tasks matching this view will appear here.</p>
        </Card>
      ) : (
        tasks.map(task => (
          <Card
            key={task.id}
            className="cursor-pointer transition-colors hover:border-primary/25 hover:bg-accent/25"
            onClick={() => onTaskClick(task)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onTaskClick(task)
              }
            }}
          >
            <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-medium truncate">{task.title}</p>
                    {task.isOverdue && (
                      <span className="text-xs flex items-center gap-1 text-destructive whitespace-nowrap">
                        <AlertCircle className="h-3 w-3" />
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                </div>

                  <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap lg:justify-end">
                    <div className="min-w-[5rem] lg:text-right">
                      <div className={`text-xs font-semibold ${getPriorityColor(task.priority)} capitalize`}>
                        {task.priority}
                      </div>
                    {task.dueDate && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusBadge(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>

                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                      {task.assignees.slice(0, 2).map(assignee => (
                        <div
                          key={assignee.id}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
                          title={assignee.name}
                        >
                          {assignee.name.charAt(0)}
                        </div>
                      ))}
                      {task.assignees.length > 2 && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-xs font-bold text-secondary-foreground">
                          +{task.assignees.length - 2}
                        </div>
                      )}
                      </div>
                    )}

                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1">
                    <Layers3 className="h-3.5 w-3.5" />
                    {task.subtasks.length} subtasks
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {task.estimatedHours ? `${task.estimatedHours}h est.` : 'No estimate'}
                  </span>
                  {task.isRecurring && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1">
                      <Repeat2 className="h-3.5 w-3.5" />
                      {task.recurringPattern}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1">
                    {task.progress}% complete
                  </span>
                </div>
              </CardContent>
            </Card>
        ))
      )}
    </div>
  )
}
