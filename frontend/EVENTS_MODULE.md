# ClubFlow Events Management Module

Complete production-ready events management frontend for ClubFlow with full API integration, RSVP system, attendance tracking, and calendar views.

## Features Implemented

### 1. Event Management
- **Create Events** - Rich form with title, description, start/end datetime, location, capacity, and image URL
- **Update Events** - Edit existing events with real-time validation
- **Delete Events** - Remove events with confirmation dialog
- **List Events** - Display all club events with filtering options
- **Event Details** - Comprehensive event page with full attendee management

### 2. RSVP System
- **Multiple RSVP States** - Going, Interested, Not Going, No Response
- **Toggle RSVP** - Quick RSVP status change with visual feedback
- **RSVP Counts** - Automatic count tracking for each status
- **Cancel RSVP** - Remove your RSVP from an event

### 3. Attendance Tracking
- **Attendee List** - Display all attendees with their RSVP status
- **Check-In System** - Mark attendees as checked-in with timestamp
- **Attendance Status** - Track who attended the event
- **Organizer View** - Manage attendees with role-based access

### 4. Calendar Views
- **Month View Calendar** - Visual calendar with event indicators
- **Date Selection** - Click dates to see events for that day
- **Event Highlighting** - Color-coded event status display
- **Date Range Filtering** - Filter events by This Month/Upcoming/All

### 5. Event Reminders
- **Reminder Types** - On day, 1 day before, 1 week before
- **Status Indicators** - Visual indicators for event timing
- **Quick Setup** - One-click reminder configuration
- **Event Status Display** - Shows if event is today, soon, or passed

### 6. Data Filtering & Search
- **Date Filtering** - All Events, This Month, Upcoming
- **Status-based Filtering** - By event status (draft, published, cancelled)
- **Capacity Display** - Shows if event is full
- **Search by Text** - Find events by title (extensible)

## File Structure

```
src/
├── components/events/
│   ├── EventForm.tsx            # Create/edit event form
│   ├── EventCard.tsx            # Event card component for lists
│   ├── EventCalendar.tsx        # Calendar view component
│   ├── RSVPToggle.tsx           # RSVP status selector
│   ├── AttendeeList.tsx         # Attendee management
│   └── EventReminder.tsx        # Reminder UI component
├── pages/
│   ├── Events.tsx               # Main events page with all views
│   └── EventDetail.tsx          # Detailed event page
├── services/
│   └── events.service.ts        # API integration service
├── store/slices/
│   └── eventSlice.ts            # Redux state management
└── types/
    └── index.ts                 # Event types and interfaces
```

## API Integration

All features connect to real backend APIs through `events.service.ts`:

### Event Operations
```typescript
// List events for a club
listEvents(clubId, params?: { page, limit, dateFrom, dateTo })

// Get single event details
getEvent(eventId)

// Create new event
createEvent(clubId, data)

// Update existing event
updateEvent(eventId, data)

// Delete event
deleteEvent(eventId)
```

### RSVP Operations
```typescript
// Set RSVP status (going/interested/not_going)
rsvpEvent(eventId, { status })

// Cancel RSVP
cancelRSVP(eventId)
```

### Attendance Operations
```typescript
// Get event attendees
getEventAttendees(eventId)

// Check in attendee
checkInAttendee(eventId, userId)

// Get events by date range
getEventsByDateRange(clubId, startDate, endDate)
```

## Redux State Management

### State Structure
```typescript
interface EventState {
  events: Event[]              // All club events
  currentEvent: Event | null   // Selected event detail
  userEvents: Event[]          // User's events
  isLoading: boolean           // Detail page loading
  isFetching: boolean          // List loading
  error: string | null         // Error messages
}
```

### Async Thunks
- `fetchClubEvents` - Load all club events
- `fetchEventDetail` - Load single event details
- `createEvent` - Create new event
- `updateEvent` - Update event
- `deleteEvent` - Delete event
- `rsvpEvent` - Update RSVP status
- `cancelRSVP` - Remove RSVP
- `fetchEventAttendees` - Load attendee list
- `checkInAttendee` - Mark attendee as checked-in
- `fetchEventsByDateRange` - Load events for date range

## Type Definitions

### Event Type
```typescript
interface Event {
  id: string
  clubId: string
  title: string
  description: string
  startDateTime: string       // ISO datetime
  endDateTime: string         // ISO datetime
  location: string
  capacity?: number
  image?: string
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  organizer: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  attendees: EventAttendee[]
  attendeeCount: number
  goingCount: number
  interestedCount: number
  reminders: EventReminder[]
  createdAt: string
  updatedAt: string
}

interface EventAttendee {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  rsvpStatus: RSVPStatus
  checkedIn: boolean
  checkedInAt?: string
  rsvpAt: string
}

enum RSVPStatus {
  GOING = 'going'
  INTERESTED = 'interested'
  NOT_GOING = 'not_going'
  NO_RESPONSE = 'no_response'
}
```

## Usage Examples

### Creating an Event
```typescript
// From EventForm component
const handleSubmit = async (e) => {
  const data: CreateEventRequest = {
    title: 'Team Meetup',
    description: 'Monthly team gathering',
    location: '123 Main St',
    startDateTime: '2024-03-15T18:00',
    endDateTime: '2024-03-15T20:00',
    capacity: 50,
    image: 'https://example.com/image.jpg'
  }
  await dispatch(createEvent({ clubId, data })).unwrap()
}
```

### RSVPing to an Event
```typescript
// From RSVPToggle component
const handleRSVP = async (status) => {
  await dispatch(rsvpEvent({
    eventId,
    data: { status: RSVPStatus.GOING }
  })).unwrap()
}
```

### Checking In Attendees
```typescript
// From AttendeeList component
const handleCheckIn = async (userId) => {
  await dispatch(checkInAttendee({
    eventId,
    userId
  })).unwrap()
}
```

## Date & Time Handling

Uses `date-fns` for all date operations:
- Format: `format(date, 'PPp')` - Shows "Mar 15, 2024, 6:00 PM"
- Comparison: `differenceInDays()`, `differenceInHours()`
- Range: `startOfMonth()`, `endOfMonth()`

## Error Handling

All API operations include:
- Error state tracking in Redux
- User-friendly error messages
- Automatic retry logic via Redux DevTools
- Loading states during API calls
- Validation before submission

## Features Ready for Production

✅ Full CRUD operations with real APIs
✅ Socket.IO integration for real-time event updates
✅ Proper error handling and user feedback
✅ Loading states and skeleton screens
✅ Type-safe with full TypeScript
✅ Responsive design for mobile/desktop
✅ Accessibility considerations
✅ Attendee management with role-based access
✅ Calendar visualization
✅ Reminder system UI

## Future Enhancements

- Email notification integration
- Calendar export (iCal format)
- Event tags/categories
- Ticket/registration system
- Event registration confirmation emails
- Advanced filtering (by organizer, status, etc.)
- Event sponsorships
- Waitlist for full events
