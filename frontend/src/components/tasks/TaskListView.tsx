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
      return 'text-yellow-600'
    case 'low':
      return 'text-green-600'
    default:
      return 'text-gray-600'
  }
}

const getStatusBadge = (status: TaskStatus) => {
  const statusMap = {
    [TaskStatus.TODO]: 'bg-slate-100 text-slate-800',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [TaskStatus.IN_REVIEW]: 'bg-purple-100 text-purple-800',
    [TaskStatus.DONE]: 'bg-green-100 text-green-800',
    [TaskStatus.ARCHIVED]: 'bg-gray-100 text-gray-800',
  }
  return statusMap[status] || 'bg-gray-100 text-gray-800'
}

export const TaskListView: React.FC<TaskListViewProps> = ({ tasks, onTaskClick }) => {
  return (
    <div className="min-w-0 space-y-2">
      {tasks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No tasks found</p>
        </Card>
      ) : (
        tasks.map(task => (
          <Card
            key={task.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onTaskClick(task)}
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

                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getStatusBadge(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>

                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                      {task.assignees.slice(0, 2).map(assignee => (
                        <div
                          key={assignee.id}
                          className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold"
                          title={assignee.name}
                        >
                          {assignee.name.charAt(0)}
                        </div>
                      ))}
                      {task.assignees.length > 2 && (
                        <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold">
                          +{task.assignees.length - 2}
                        </div>
                      )}
                      </div>
                    )}

                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2.5 py-1">
                    <Layers3 className="h-3.5 w-3.5" />
                    {task.subtasks.length} subtasks
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2.5 py-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {task.estimatedHours ? `${task.estimatedHours}h est.` : 'No estimate'}
                  </span>
                  {task.isRecurring && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2.5 py-1">
                      <Repeat2 className="h-3.5 w-3.5" />
                      {task.recurringPattern}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2.5 py-1">
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
