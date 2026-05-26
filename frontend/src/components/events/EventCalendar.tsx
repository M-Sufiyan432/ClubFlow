import React, { useState } from 'react'
import { Event } from '@/types/index'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

interface EventCalendarProps {
  events: Event[]
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: Event) => void
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ events, onDateSelect, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDateTime)
      return isSameDay(eventDate, date)
    })
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const firstDayOfWeek = days[0].getDay()
  const emptyDays = Array(firstDayOfWeek).fill(null)
  const calendarDays = [...emptyDays, ...days]

  const weeks = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <div className="min-w-[42rem] space-y-4">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-2">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-2">
                {week.map((day, dayIdx) => {
                  const dayEvents = day ? getEventsForDate(day) : []
                  const isCurrentMonth = day ? isSameMonth(day, currentDate) : false
                  const isToday = day ? isSameDay(day, new Date()) : false

                  return (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      onClick={() => day && onDateSelect?.(day)}
                      className={`min-h-24 cursor-pointer rounded-md border p-2 transition-colors ${
                        !isCurrentMonth
                          ? 'bg-secondary/30 text-muted-foreground'
                          : isToday
                            ? 'border-primary/35 bg-primary/10'
                            : 'bg-card hover:bg-secondary/60'
                      }`}
                    >
                      {day && (
                        <>
                          <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-primary' : ''}`}>
                            {format(day, 'd')}
                          </p>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map((event) => (
                              <button
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEventClick?.(event)
                                }}
                                className="w-full truncate rounded-md border border-primary/15 bg-primary/10 p-1 text-left text-xs text-primary transition-colors hover:bg-primary/15"
                              >
                                {event.title}
                              </button>
                            ))}
                            {dayEvents.length > 2 && (
                              <p className="text-xs text-muted-foreground px-1">
                                +{dayEvents.length - 2} more
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Event count */}
          <div className="pt-4 border-t text-sm text-muted-foreground">
            <p>{events.length} events this month</p>
          </div>
        </div>
        </div>
      </CardContent>
    </Card>
  )
}
