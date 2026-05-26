import React, { useMemo } from 'react'
import { Task } from '@/types/index'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TaskCalendarViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  isLoading?: boolean
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onTaskClick,
  isLoading,
}) => {
  const [currentDate, setCurrentDate] = React.useState(new Date())

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const calendarDays = useMemo(() => {
    const days = []
    const total = daysInMonth(currentDate)
    const firstDay = firstDayOfMonth(currentDate)

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= total; i++) {
      days.push(i)
    }
    return days
  }, [currentDate])

  const getTasksForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks.filter(task => task.dueDate?.startsWith(dateStr))
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getPriorityBg = (priority: string) => {
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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-center text-base font-semibold sm:text-lg">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Card className="min-w-[42rem] p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-2">
          {/* Week days header */}
          {weekDays.map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const dayTasks = day ? getTasksForDate(day) : []
            const isCurrentDay =
              day &&
              new Date().toDateString() ===
                new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

            return (
              <div
                key={index}
                className={`min-h-24 rounded-md border p-2 ${
                  isCurrentDay ? 'border-primary/35 bg-primary/10' : 'bg-card'
                } ${day ? 'cursor-pointer transition-colors hover:bg-secondary/60' : ''}`}
              >
                {day && (
                  <>
                    <div className={`mb-1 text-sm font-semibold ${isCurrentDay ? 'text-primary' : ''}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 2).map(task => (
                        <button
                          type="button"
                          key={task.id}
                          onClick={() => onTaskClick(task)}
                          className="w-full cursor-pointer truncate rounded-md border border-border bg-card p-1 text-left text-xs transition-colors hover:border-primary/40 hover:bg-accent/35"
                        >
                          <div className="font-medium truncate">{task.title}</div>
                          <Badge className={`${getPriorityBg(task.priority)} text-xs`}>
                            {task.priority}
                          </Badge>
                        </button>
                      ))}
                      {dayTasks.length > 2 && (
                        <div className="text-xs text-muted-foreground pl-1">
                          +{dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
        </Card>
      </div>
    </div>
  )
}
