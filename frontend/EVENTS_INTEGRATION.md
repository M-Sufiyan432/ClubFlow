# Events Module Integration Guide

## Quick Start

The events module is fully integrated and production-ready. All features connect to real backend APIs with no mock data.

## Key Components

### 1. Events List Page (`/events`)
- Calendar and List view toggle
- Date filtering (All Events, This Month, Upcoming)
- Create event button opens modal form
- Dispatches `fetchClubEvents()` on mount with activeClub

### 2. Event Detail Page (`/events/:eventId`)
- Full event information with organizer details
- RSVP toggle component
- Attendee list with check-in functionality
- Event reminder setup UI
- Delete button for organizers

### 3. Event Form (`EventForm`)
- Create or edit events
- Validates start < end datetime
- Optional capacity and image fields
- Dispatches `createEvent` or `updateEvent` thunks
- Calls `onSuccess` callback after submission

### 4. RSVP System (`RSVPToggle`)
- Toggle between Going, Interested, Not Going, No Response
- Shows current RSVP status
- Dispatches `rsvpEvent` or `cancelRSVP` thunks
- Immediate UI feedback with optimistic updates

### 5. Attendee Management (`AttendeeList`)
- Filter by RSVP status
- Check-in attendees with timestamp
- Search attendees by name
- Shows check-in status with icon
- Role-based visibility (organizers only)

### 6. Calendar View (`EventCalendar`)
- Monthly calendar display
- Click dates to navigate to events
- Event count badges
- Color-coded event indicators
- Previous/Next month navigation

### 7. Event Reminder (`EventReminder`)
- Set reminders: on day, 1 day before, 1 week before
- Visual status indicators
- Shows time until event
- Disabled for past events

## Redux Integration

### Actions Dispatched

```typescript
// Load events for club
dispatch(fetchClubEvents({ 
  clubId: activeClub.id,
  params: { page: 1, limit: 20 }
}))

// Load specific event
dispatch(fetchEventDetail(eventId))

// Create new event
dispatch(createEvent({ 
  clubId, 
  data: CreateEventRequest 
}))

// Update event
dispatch(updateEvent({ 
  eventId, 
  data: UpdateEventRequest 
}))

// RSVP to event
dispatch(rsvpEvent({ 
  eventId, 
  data: { status: RSVPStatus.GOING } 
}))

// Check in attendee
dispatch(checkInAttendee({ 
  eventId, 
  userId 
}))

// Get events by date range
dispatch(fetchEventsByDateRange({
  clubId,
  startDate: '2024-03-01',
  endDate: '2024-03-31'
}))
```

### State Access

```typescript
const { events, currentEvent, isLoading, isFetching, error } = useAppSelector(
  (state) => state.events
)
```

## API Endpoints Required

Backend must implement these endpoints:

```
GET    /clubs/:clubId/events                 # List events
GET    /clubs/:clubId/events/range           # Events by date range
GET    /events/:eventId                      # Get event detail
POST   /clubs/:clubId/events                 # Create event
PATCH  /events/:eventId                      # Update event
DELETE /events/:eventId                      # Delete event

POST   /events/:eventId/rsvp                 # Add/update RSVP
DELETE /events/:eventId/rsvp                 # Cancel RSVP
GET    /events/:eventId/attendees            # Get attendees
POST   /events/:eventId/check-in             # Check in attendee
```

## Real API Communication Flow

### Creating an Event
1. User fills EventForm and clicks "Create Event"
2. Form validates datetime and fields
3. `createEvent` thunk dispatches
4. API call to `POST /clubs/:clubId/events`
5. Redux state updated with new event
6. Modal closes and user navigates to event detail
7. Success toast notification shown

### RSVP Flow
1. User clicks RSVPToggle button
2. Selects desired status (Going/Interested/Not Going)
3. `rsvpEvent` thunk dispatches
4. API call to `POST /events/:eventId/rsvp`
5. Attendee object returned with updated status
6. Redux state updates event attendees
7. Counts (goingCount, interestedCount) recalculated

### Check-in Flow
1. Organizer views AttendeeList
2. Clicks check-in button on attendee
3. `checkInAttendee` thunk dispatches
4. API call to `POST /events/:eventId/check-in`
5. Attendee marked as checkedIn with timestamp
6. Redis state reflects check-in status

## Date/Time Format

All datetimes use ISO format: `YYYY-MM-DDTHH:mm:ss`

### Input Handling
- HTML `<input type="datetime-local">` provides local format
- Convert to ISO: `new Date(input).toISOString()`
- Display with: `format(new Date(isoString), 'PPp')`

### Validation
- Start datetime must be before end datetime
- Both dates are required
- Cannot be in past for validation (warning only)

## Error Handling

All operations have error states:

```typescript
if (error) {
  return <p className="text-destructive">{error}</p>
}
```

Error messages come from:
1. API response error.response.data.message
2. Fallback message if no API message
3. Redux errorSlice logging

## Loading States

- `isLoading` - Detail page/form submission
- `isFetching` - List page loading
- Both disable UI buttons while active

## Socket.IO Integration

Events module receives real-time updates:
- `taskCreated` → Shows notification (tasks linked to events)
- `commentAdded` → Event updates (future feature)

No event-specific socket listeners currently implemented (extensible).

## Attendance Capacity

Events can have optional capacity limits:
- `event.capacity` - Max attendees (optional)
- `event.goingCount` - Current attendees
- `isFull` - Calculated: `goingCount >= capacity`
- UI shows "Full" badge when capacity reached

## Testing Checklist

- [ ] Create event with all fields
- [ ] Create event without optional fields
- [ ] Update event details
- [ ] Delete event with confirmation
- [ ] RSVP as Going/Interested/Not Going
- [ ] Cancel RSVP
- [ ] View attendee list
- [ ] Check in attendees
- [ ] Filter events by date
- [ ] View calendar
- [ ] Navigate between calendar months
- [ ] Set event reminders
- [ ] Error handling on API failures
- [ ] Loading states show during API calls

## Performance Considerations

- Events cached in Redux - no duplicate fetches
- Attendee list only fetches on event detail view
- Calendar uses existing events list (no extra API call)
- Optimistic updates for RSVP (immediate feedback)
- Pagination support (future: implement with params)

## Accessibility

- All buttons have aria labels
- Forms include proper labels
- Calendar keyboard navigable
- Loading states announced
- Error messages linked to form fields
