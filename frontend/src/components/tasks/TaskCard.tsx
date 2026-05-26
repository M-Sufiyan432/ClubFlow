import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Task } from '@/types/index'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
  draggable?: boolean
  onDragStart?: (event: React.DragEvent, task: Task) => void
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'high':
      return 'border-orange-200 bg-orange-50 text-orange-700'
    case 'medium':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'low':
      return 'border-green-200 bg-green-50 text-green-700'
    default:
      return 'border-border bg-secondary text-muted-foreground'
  }
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, draggable = false, onDragStart }) => (
  <Card
    draggable={draggable}
    onDragStart={event => onDragStart?.(event, task)}
    onClick={() => onClick(task)}
    className="cursor-grab p-3 transition-colors active:cursor-grabbing hover:border-primary/30 hover:bg-accent/35"
    role="button"
    tabIndex={0}
    onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onClick(task)
      }
    }}
  >
    <p className="mb-2 line-clamp-2 text-sm font-medium">{task.title}</p>

    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {task.isOverdue && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            Overdue
          </span>
        )}
      </div>

      {task.dueDate && <span className="text-xs text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>}

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {task.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{task.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      {task.assignees.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {task.assignees.slice(0, 3).map(assignee => (
            <div
              key={assignee.id}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
              title={assignee.name}
            >
              {assignee.name.charAt(0)}
            </div>
          ))}
        </div>
      )}
    </div>
  </Card>
)
