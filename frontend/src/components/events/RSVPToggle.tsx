import React from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { rsvpEvent, cancelRSVP } from '@/store/slices/eventSlice'
import { RSVPStatus } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface RSVPToggleProps {
  eventId: string
  currentStatus?: RSVPStatus
  onRSVPChange?: (status: RSVPStatus | null) => void
}

export const RSVPToggle: React.FC<RSVPToggleProps> = ({ eventId, currentStatus, onRSVPChange }) => {
  const dispatch = useAppDispatch()
  const { isLoading } = useAppSelector((state) => state.events)

  const rsvpOptions = [
    { value: RSVPStatus.GOING, label: 'Going', color: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' },
    { value: RSVPStatus.INTERESTED, label: 'Interested', color: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { value: RSVPStatus.NOT_GOING, label: 'Not Going', color: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' },
  ]

  const handleRSVP = async (status: RSVPStatus) => {
    try {
      if (currentStatus === status) {
        // Cancel RSVP if clicking same status
        await dispatch(cancelRSVP(eventId)).unwrap()
        onRSVPChange?.(null)
      } else {
        // Change RSVP status
        await dispatch(rsvpEvent({ eventId, data: { status } })).unwrap()
        onRSVPChange?.(status)
      }
    } catch (err) {
      console.error('[v0] RSVP error:', err)
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {rsvpOptions.map((option) => (
        <Button
          key={option.value}
          onClick={() => handleRSVP(option.value)}
          disabled={isLoading}
          variant={currentStatus === option.value ? 'default' : 'outline'}
          className={currentStatus === option.value ? 'w-full sm:w-auto' : `w-full sm:w-auto ${option.color}`}
          size="sm"
        >
          {currentStatus === option.value ? <Check className="mr-1 h-4 w-4" /> : null}
          {option.label}
        </Button>
      ))}

      {currentStatus && (
        <Button
          onClick={() => handleRSVP(currentStatus)}
          disabled={isLoading}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
