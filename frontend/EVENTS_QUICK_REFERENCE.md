# Events Module - Quick Reference

## File Locations

```
src/components/events/
  ├── EventForm.tsx          # Create/edit forms
  ├── EventCard.tsx          # Event cards for lists
  ├── EventCalendar.tsx      # Calendar view
  ├── RSVPToggle.tsx         # RSVP selector
  ├── AttendeeList.tsx       # Attendee management
  └── EventReminder.tsx      # Reminder UI

src/pages/
  ├── Events.tsx             # Main page with calendar/list
  └── EventDetail.tsx        # Event detail page

src/services/
  └── events.service.ts      # API client

src/store/slices/
  └── eventSlice.ts          # Redux state

src/types/
  └── index.ts               # Event types (70+ lines added)

Routes:
  /events                    # Main page
  /events/:eventId           # Detail page
```

## Component Quick Start

### EventForm
```tsx
<EventForm
  clubId={clubId}
  event={eventToEdit}  // Optional
  onSuccess={() => {}}  // Callback
  onCancel={() => {}}   // Callback
/>
```

### EventCard
```tsx
<EventCard
  event={event}
  onDelete={(eventId) => {}}  // Optional
  showActions={true}          // Optional
/>
```

### RSVPToggle
```tsx
<RSVPToggle
  event={event}
  userRsvpStatus={RSVPStatus.GOING}  // Optional
  onRsvp={(status) => {}}            // Optional
  isLoading={false}
/>
```

### AttendeeList
```tsx
<AttendeeList
  event={event}
  isOrganizerMode={true}   // Optional
  onCheckIn={(userId) => {}} // Optional
/>
```

### EventCalendar
```tsx
<EventCalendar
  events={events}
  onDateSelect={(date) => {}}  // Optional
  onEventClick={(event) => {}} // Optional
/>
```

### EventReminder
```tsx
<EventReminder
  event={event}
  onSetReminder={(time) => {}} // Optional
  isLoading={false}
/>
```

## Redux Dispatch Examples

```typescript
import { useAppDispatch } from '@/store/hooks'
import { 
  fetchClubEvents, fetchEventDetail, createEvent,
  updateEvent, deleteEvent, rsvpEvent, cancelRSVP,
  fetchEventAttendees, checkInAttendee, fetchEventsByDateRange
} from '@/store/slices/eventSlice'

const dispatch = useAppDispatch()

// List events
dispatch(fetchClubEvents({ clubId }))

// Get detail
dispatch(fetchEventDetail(eventId))

// Create
dispatch(createEvent({ clubId, data }))

// Update
dispatch(updateEvent({ eventId, data }))

// Delete
dispatch(deleteEvent(eventId))

// RSVP
dispatch(rsvpEvent({ eventId, data: { status } }))

// Cancel RSVP
dispatch(cancelRSVP(eventId))

// Get attendees
dispatch(fetchEventAttendees(eventId))

// Check in
dispatch(checkInAttendee({ eventId, userId }))

// Date range
dispatch(fetchEventsByDateRange({ 
  clubId, 
  startDate: '2024-03-01', 
  endDate: '2024-03-31' 
}))
```

## State Access

```typescript
import { useAppSelector } from '@/store/hooks'

const state = useAppSelector((state) => state.events)

const {
  events,           // Event[]
  currentEvent,     // Event | null
  userEvents,       // Event[]
  isLoading,        // boolean
  isFetching,       // boolean
  error             // string | null
} = state
```

## Event Type Structure

```typescript
event = {
  id: 'uuid',
  clubId: 'uuid',
  title: 'Event Title',
  description: 'Long description',
  startDateTime: '2024-03-15T18:00:00',
  endDateTime: '2024-03-15T20:00:00',
  location: '123 Main St',
  capacity: 50,
  image: 'https://...',
  status: 'published',
  organizer: { id, name, email, avatar },
  attendees: [
    {
      id: 'uuid',
      userId: 'uuid',
      name: 'John',
      email: 'john@example.com',
      rsvpStatus: 'going',
      checkedIn: true,
      checkedInAt: '2024-03-15T18:05:00',
      rsvpAt: '2024-03-10T10:00:00'
    }
  ],
  attendeeCount: 45,
  goingCount: 40,
  interestedCount: 5,
  reminders: [],
  createdAt: '2024-03-10T10:00:00',
  updatedAt: '2024-03-10T10:00:00'
}
```

## API Endpoints Reference

```
Event Operations:
  GET    /clubs/:clubId/events
  GET    /clubs/:clubId/events/range?startDate=...&endDate=...
  GET    /events/:eventId
  POST   /clubs/:clubId/events
  PATCH  /events/:eventId
  DELETE /events/:eventId

RSVP:
  POST   /events/:eventId/rsvp          (body: { status })
  DELETE /events/:eventId/rsvp

Attendance:
  GET    /events/:eventId/attendees
  POST   /events/:eventId/check-in      (body: { userId })
```

## Common Patterns

### Load Events on Mount
```typescript
useEffect(() => {
  dispatch(fetchClubEvents({ clubId: activeClub.id }))
}, [activeClub?.id, dispatch])
```

### Handle Event Creation
```typescript
const handleCreate = async (data) => {
  try {
    await dispatch(createEvent({ clubId, data })).unwrap()
    showSuccess('Event created')
  } catch (err) {
    showError(err.message)
  }
}
```

### Handle RSVP
```typescript
const handleRSVP = async (status) => {
  try {
    await dispatch(rsvpEvent({ 
      eventId, 
      data: { status } 
    })).unwrap()
    showSuccess('RSVP updated')
  } catch (err) {
    showError('Failed to RSVP')
  }
}
```

### Format Dates
```typescript
import { format } from 'date-fns'

const displayDate = format(
  new Date(event.startDateTime),
  'PPp'  // "Mar 15, 2024, 6:00 PM"
)

const displayDay = format(
  new Date(event.startDateTime),
  'EEEE, MMMM d'  // "Friday, March 15"
)
```

## Enums

```typescript
enum RSVPStatus {
  GOING = 'going'
  INTERESTED = 'interested'
  NOT_GOING = 'not_going'
  NO_RESPONSE = 'no_response'
}

enum EventStatus {
  DRAFT = 'draft'
  PUBLISHED = 'published'
  CANCELLED = 'cancelled'
  COMPLETED = 'completed'
}
```

## Error Handling

```typescript
if (error) {
  return (
    <div className="text-destructive">
      <p>{error}</p>
      <button onClick={() => dispatch(fetchClubEvents({ clubId }))}>
        Retry
      </button>
    </div>
  )
}
```

## Loading States

```typescript
if (isLoading) return <LoadingSpinner />
if (isFetching) return <SkeletonList />
if (error) return <ErrorMessage />
if (!events.length) return <EmptyState />

return <EventsList events={events} />
```

## Debugging Commands

```typescript
// Log current state
console.log('[v0] Events state:', store.getState().events)

// Dispatch action with logging
dispatch(fetchClubEvents({ clubId })).unwrap()
  .then(data => console.log('[v0] Events loaded:', data))
  .catch(err => console.error('[v0] Error:', err))

// Check Redux DevTools
// Open browser DevTools → Redux tab → Inspect actions/state
```

## Testing Checklist

- [ ] Create event with all fields
- [ ] Create event with minimal fields
- [ ] Update event
- [ ] Delete event
- [ ] View event detail
- [ ] RSVP as Going
- [ ] RSVP as Interested
- [ ] RSVP as Not Going
- [ ] Cancel RSVP
- [ ] View attendee list
- [ ] Check in attendee
- [ ] Filter events by date
- [ ] Navigate calendar months
- [ ] Click date to see events
- [ ] Error handling (network down)
- [ ] Loading states display
- [ ] Mobile responsive
- [ ] Keyboard navigation

## Common Issues & Solutions

### Event not updating
- Check Redux DevTools for thunk status
- Verify API response format
- Check network tab for API errors

### RSVP not persisting
- Verify user is authenticated
- Check API endpoint URL
- Check Bearer token in headers

### Calendar not showing events
- Verify events have valid startDateTime
- Check date format (ISO required)
- Check timezone handling

### Form validation failing
- Check datetime-local browser support
- Verify start < end validation
- Check input field names match form state

## Performance Tips

- Use `fetchClubEvents` once per club change
- Cache events in Redux (no duplicate fetches)
- Load attendees only when viewing event detail
- Use `isFetching` to prevent duplicate loads
- Implement pagination for large event lists

## Next Steps

1. Test all endpoints with backend
2. Add email notification integration
3. Implement event search
4. Add event categories/tags
5. Create analytics dashboard
6. Add QR code check-in
7. Implement waitlist system
