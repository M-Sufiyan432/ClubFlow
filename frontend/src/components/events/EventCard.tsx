import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Event } from '@/types/index'
import { MapPin, Users, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface EventCardProps {
  event: Event
  onDelete?: (eventId: string) => void
  showActions?: boolean
}

export const EventCard: React.FC<EventCardProps> = ({ event, onDelete, showActions = true }) => {
  const navigate = useNavigate()
  const startDate = new Date(event.startDateTime)

  const handleCardClick = () => {
    navigate(`/events/${event.id}`)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this event?')) {
      onDelete?.(event.id)
    }
  }

  const isFull = event.capacity && event.goingCount >= event.capacity

  return (
    <Card
      className="cursor-pointer overflow-hidden transition-colors hover:border-primary/25 hover:bg-accent/25"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleCardClick()
        }
      }}
    >
      {event.image && (
        <div className="h-40 w-full overflow-hidden bg-secondary">
          <img
            src={event.image}
            alt={event.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      <CardHeader className="pb-3">
        <h3 className="truncate text-base font-semibold">{event.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{event.description}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{format(startDate, 'PPp')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {event.goingCount}
              {event.capacity && ` / ${event.capacity}`} going
              {isFull && ' (Full)'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 border-t border-border pt-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={handleCardClick}
          >
            View Details
          </Button>
          {showActions && onDelete && (
            <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            aria-label={`Delete ${event.title}`}
          >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
