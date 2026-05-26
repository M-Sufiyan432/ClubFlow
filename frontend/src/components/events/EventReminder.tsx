import React, { useState } from 'react'
import { Bell, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Event } from '@/types/index'
import { format, differenceInDays, differenceInHours } from 'date-fns'

interface EventReminderProps {
  event: Event
  onSetReminder?: (reminderTime: string) => void
  isLoading?: boolean
}

const REMINDER_OPTIONS = [
  { value: 'on_day', label: 'Day of event' },
  { value: '1_day_before', label: '1 day before' },
  { value: '1_week_before', label: '1 week before' },
]

export const EventReminder: React.FC<EventReminderProps> = ({ event, onSetReminder, isLoading = false }) => {
  const [selectedReminder, setSelectedReminder] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const startDate = new Date(event.startDateTime)
  const now = new Date()
  const daysUntilEvent = differenceInDays(startDate, now)
  const hoursUntilEvent = differenceInHours(startDate, now)

  const isEventSoon = hoursUntilEvent < 24 && hoursUntilEvent > 0
  const isEventToday = startDate.toDateString() === now.toDateString()
  const isEventPassed = startDate < now

  const getStatusIcon = () => {
    if (isEventPassed) return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    if (isEventToday) return <Bell className="h-4 w-4 text-yellow-500" />
    if (isEventSoon) return <Bell className="h-4 w-4 text-orange-500" />
    return <Bell className="h-4 w-4 text-muted-foreground" />
  }

  const getStatusText = () => {
    if (isEventPassed) return 'Event has passed'
    if (isEventToday) return 'Event is today'
    if (isEventSoon) return `Event in ${hoursUntilEvent} hours`
    return `Event in ${daysUntilEvent} days`
  }

  const hasReminder = event.reminders && event.reminders.length > 0

  const handleSetReminder = (reminderTime: string) => {
    setSelectedReminder(reminderTime)
    onSetReminder?.(reminderTime)
    setTimeout(() => setIsExpanded(false), 500)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Event Reminder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          {hasReminder && <Check className="h-4 w-4 text-green-500" />}
        </div>

        <div className="text-xs text-muted-foreground">
          {format(startDate, 'PPP')} at {format(startDate, 'p')}
        </div>

        {!isEventPassed && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsExpanded(!isExpanded)}
              disabled={isLoading}
            >
              {hasReminder ? 'Update Reminder' : 'Set Reminder'}
            </Button>

            {isExpanded && (
              <div className="space-y-2 pt-2 border-t border-border">
                {REMINDER_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedReminder === option.value ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleSetReminder(option.value)}
                    disabled={isLoading}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
