import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { fetchClubEvents, fetchEventsByDateRange } from '@/store/slices/eventSlice'
import { EventForm } from '@/components/events/EventForm'
import { EventCalendar } from '@/components/events/EventCalendar'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Event } from '@/types/index'
import { Calendar, List, Plus } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

type ViewType = 'calendar' | 'list'

export const Events: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { events, isFetching, error } = useAppSelector((state) => state.events)
  const { activeClub } = useAppSelector((state) => state.clubs)
  const [viewType, setViewType] = useState<ViewType>('calendar')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    if (!activeClub?.id) return

    const today = new Date()
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)

    if (dateFilter === 'all') {
      dispatch(fetchClubEvents({ clubId: activeClub.id }))
    } else if (dateFilter === 'this_month') {
      dispatch(
        fetchEventsByDateRange({
          clubId: activeClub.id,
          startDate: format(monthStart, 'yyyy-MM-dd'),
          endDate: format(monthEnd, 'yyyy-MM-dd'),
        })
      )
    } else if (dateFilter === 'upcoming') {
      dispatch(
        fetchEventsByDateRange({
          clubId: activeClub.id,
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd'),
        })
      )
    }
  }, [activeClub?.id, dateFilter, dispatch])

  if (!activeClub) {
    return (
      <BaseLayout title="Events">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Please select a club first</p>
        <Button onClick={() => navigate('/clubs')}>Go to Clubs</Button>
      </div>
      </BaseLayout>
    )
  }

  const handleEventClick = (event: Event) => {
    navigate(`/events/${event.id}`)
  }

  const handleDateSelect = (date: Date) => {
    const eventsOnDate = events.filter((e) => {
      const eventDate = new Date(e.startDateTime)
      return eventDate.toDateString() === date.toDateString()
    })

    if (eventsOnDate.length > 0) {
      handleEventClick(eventsOnDate[0])
    }
  }

  return (
    <BaseLayout title="Events">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track club events</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={dateFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setDateFilter('all')}
          size="sm"
        >
          All Events
        </Button>
        <Button
          variant={dateFilter === 'this_month' ? 'default' : 'outline'}
          onClick={() => setDateFilter('this_month')}
          size="sm"
        >
          This Month
        </Button>
        <Button
          variant={dateFilter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setDateFilter('upcoming')}
          size="sm"
        >
          Upcoming
        </Button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-3 sm:p-4">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
            <div className="p-4 sm:p-5">
              <EventForm
                clubId={activeClub.id}
                onSuccess={() => {
                  setShowCreateForm(false)
                  dispatch(fetchClubEvents({ clubId: activeClub.id }))
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Type Toggle */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={viewType === 'calendar' ? 'default' : 'outline'}
          onClick={() => setViewType('calendar')}
          size="sm"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Calendar
        </Button>
        <Button
          variant={viewType === 'list' ? 'default' : 'outline'}
          onClick={() => setViewType('list')}
          size="sm"
        >
          <List className="mr-2 h-4 w-4" />
          List
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      {viewType === 'calendar' && (
        isFetching && events.length === 0 ? (
          <SkeletonCard count={1} />
        ) : (
          <EventCalendar
            events={events}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
          />
        )
      )}

      {/* List View */}
      {viewType === 'list' && (
        <div className="space-y-3">
          {isFetching && !events.length ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">Loading events...</p>
              </CardContent>
            </Card>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">No events found</p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => handleEventClick(event)}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{event.description.substring(0, 100)}...</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>{format(new Date(event.startDateTime), 'PPP p')}</span>
                        <span>{event.location}</span>
                        <span>{event.goingCount} going</span>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-primary">{event.goingCount}</div>
                      <div className="text-xs text-muted-foreground">Attendees</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
    </BaseLayout>
  )
}
