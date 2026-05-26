import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { fetchEventDetail, deleteEvent, checkInAttendee } from '@/store/slices/eventSlice'
import { RSVPToggle } from '@/components/events/RSVPToggle'
import { AttendeeList } from '@/components/events/AttendeeList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { MapPin, Calendar, Users, Trash2, ArrowLeft } from 'lucide-react'
import { RSVPStatus } from '@/types/index'

export const EventDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { currentEvent, isLoading } = useAppSelector((state) => state.events)
  const { user } = useAppSelector((state) => state.auth)
  const [userRsvpStatus, setUserRsvpStatus] = useState<RSVPStatus | undefined>()

  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventDetail(eventId))
    }
  }, [eventId, dispatch])

  useEffect(() => {
    if (currentEvent && user) {
      const userAttendee = currentEvent.attendees.find((a) => a.userId === user.id)
      setUserRsvpStatus(userAttendee?.rsvpStatus as RSVPStatus | undefined)
    }
  }, [currentEvent, user])

  const handleDelete = async () => {
    if (!eventId || !confirm('Are you sure you want to delete this event?')) return

    try {
      await dispatch(deleteEvent(eventId)).unwrap()
      navigate(-1)
    } catch (err) {
      console.error('[v0] Delete error:', err)
    }
  }

  const handleCheckIn = async (userId: string) => {
    if (!eventId) return

    try {
      await dispatch(checkInAttendee({ eventId, userId })).unwrap()
    } catch (err) {
      console.error('[v0] Check-in error:', err)
    }
  }

  if (isLoading) {
    return (
      <BaseLayout title="Event">
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading event details...</p>
      </div>
      </BaseLayout>
    )
  }

  if (!currentEvent) {
    return (
      <BaseLayout title="Event">
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Event not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
      </BaseLayout>
    )
  }

  const startDate = format(new Date(currentEvent.startDateTime), 'PPP p')
  const endDate = format(new Date(currentEvent.endDateTime), 'p')
  const isEventPast = new Date(currentEvent.endDateTime) < new Date()
  const capacityFull = currentEvent.capacity && currentEvent.goingCount >= currentEvent.capacity
  const isOrganizer = user?.id === currentEvent.organizer.id

  return (
    <BaseLayout title={currentEvent.title}>
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {isOrganizer && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Event
          </Button>
        )}
      </div>

      {/* Event Image */}
      {currentEvent.image && (
        <div className="h-64 overflow-hidden rounded-lg border border-border bg-secondary sm:h-80 lg:h-96">
          <img
            src={currentEvent.image}
            alt={currentEvent.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Title and Status */}
          <Card>
            <CardContent className="p-5">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-semibold sm:text-3xl">{currentEvent.title}</h1>
                  {isEventPast && (
                    <p className="text-sm text-amber-600 mt-2">This event has ended</p>
                  )}
                </div>

                {/* Event Details */}
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{startDate}</p>
                      <p className="text-sm text-muted-foreground">to {endDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm">{currentEvent.location}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm">
                      {currentEvent.goingCount} going
                      {currentEvent.capacity && ` / ${currentEvent.capacity} capacity`}
                      {capacityFull && (
                        <span className="text-destructive ml-2">(Capacity full)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About this event</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{currentEvent.description}</p>
            </CardContent>
          </Card>

          {/* Organizer */}
          <Card>
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {currentEvent.organizer.avatar && (
                  <img
                    src={currentEvent.organizer.avatar}
                    alt={currentEvent.organizer.name}
                  className="h-10 w-10 rounded-md object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-sm">{currentEvent.organizer.name}</p>
                  <p className="text-xs text-muted-foreground">{currentEvent.organizer.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* RSVP Section */}
          {!isEventPast && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Response</CardTitle>
              </CardHeader>
              <CardContent>
                <RSVPToggle
                  eventId={currentEvent.id}
                  currentStatus={userRsvpStatus}
                  onRSVPChange={(status) => setUserRsvpStatus(status || undefined)}
                />
              </CardContent>
            </Card>
          )}

          {/* Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              {currentEvent.reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reminders set</p>
              ) : (
                <ul className="space-y-2">
                  {currentEvent.reminders.map((reminder) => (
                    <li key={reminder.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span>{reminder.reminderTime.replace(/_/g, ' ')}</span>
                        {reminder.isSent && (
                          <span className="text-xs text-muted-foreground">(sent)</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendees */}
      <AttendeeList
        attendees={currentEvent.attendees}
        onCheckIn={isOrganizer ? handleCheckIn : undefined}
        isLoading={isLoading}
      />
    </div>
    </BaseLayout>
  )
}
