import React, { useMemo } from 'react'
import { Task, TaskStatus } from '@/types/index'
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
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <Button variant="outline" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Card className="min-w-[42rem] p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-2">
          {/* Week days header */}
          {weekDays.map(day => (
            <div key={day} className="text-center font-semibold text-sm py-2">
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
                className={`min-h-24 p-2 border rounded-lg ${
                  isCurrentDay ? 'bg-blue-50 border-blue-300' : 'bg-background'
                } ${day ? 'cursor-pointer hover:bg-secondary/50' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-semibold mb-1 ${isCurrentDay ? 'text-blue-600' : ''}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 2).map(task => (
                        <div
                          key={task.id}
                          onClick={() => onTaskClick(task)}
                          className="text-xs p-1 bg-white border rounded truncate cursor-pointer hover:shadow-sm"
                        >
                          <div className="font-medium truncate">{task.title}</div>
                          <Badge className={`${getPriorityBg(task.priority)} text-xs`}>
                            {task.priority}
                          </Badge>
                        </div>
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
