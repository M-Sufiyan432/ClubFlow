import React from 'react'
import { EventAttendee, RSVPStatus } from '@/types/index'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Clock, X } from 'lucide-react'

interface AttendeeListProps {
  attendees: EventAttendee[]
  onCheckIn?: (userId: string) => void
  isLoading?: boolean
}

export const AttendeeList: React.FC<AttendeeListProps> = ({ attendees, onCheckIn, isLoading }) => {
  const groupedAttendees = {
    going: attendees.filter((a) => a.rsvpStatus === RSVPStatus.GOING),
    interested: attendees.filter((a) => a.rsvpStatus === RSVPStatus.INTERESTED),
    notGoing: attendees.filter((a) => a.rsvpStatus === RSVPStatus.NOT_GOING),
  }

  const getStatusIcon = (status: RSVPStatus) => {
    switch (status) {
      case RSVPStatus.GOING:
        return <Check className="h-4 w-4 text-green-600" />
      case RSVPStatus.INTERESTED:
        return <Clock className="h-4 w-4 text-blue-600" />
      case RSVPStatus.NOT_GOING:
        return <X className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const renderAttendeeGroup = (title: string, list: EventAttendee[]) => {
    if (list.length === 0) return null

    return (
      <div key={title} className="mb-6">
        <h4 className="font-semibold text-sm mb-3">
          {title} ({list.length})
        </h4>
        <div className="space-y-2">
          {list.map((attendee) => (
            <div key={attendee.userId} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                {attendee.avatar && (
                  <img
                    src={attendee.avatar}
                    alt={attendee.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attendee.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{attendee.email}</p>
                </div>
                {getStatusIcon(attendee.rsvpStatus)}
              </div>
              {attendee.checkedIn ? (
                <div className="flex items-center gap-2 ml-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-600">Checked in</span>
                </div>
              ) : (
                onCheckIn && (
                  <button
                    onClick={() => onCheckIn(attendee.userId)}
                    disabled={isLoading}
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                  >
                    Check In
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Attendees</span>
          <span className="text-sm font-normal text-muted-foreground">
            {attendees.length} total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attendees.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No attendees yet</p>
        ) : (
          <div>
            {renderAttendeeGroup('Going', groupedAttendees.going)}
            {renderAttendeeGroup('Interested', groupedAttendees.interested)}
            {renderAttendeeGroup('Not Going', groupedAttendees.notGoing)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
