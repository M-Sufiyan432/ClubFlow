import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { eventsService } from '@/services/events.service'
import { Event, CreateEventRequest, UpdateEventRequest, RSVPRequest, RSVPStatus } from '@/types/index'

export interface EventState {
  events: Event[]
  currentEvent: Event | null
  userEvents: Event[]
  isLoading: boolean
  isFetching: boolean
  error: string | null
}

const initialState: EventState = {
  events: [],
  currentEvent: null,
  userEvents: [],
  isLoading: false,
  isFetching: false,
  error: null,
}

// Async thunks
export const fetchClubEvents = createAsyncThunk(
  'events/fetchClubEvents',
  async ({ clubId, params }: { clubId: string; params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string } }, { rejectWithValue }) => {
    try {
      const response = await eventsService.listEvents(clubId, params)
      return response.data.events
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch events')
    }
  }
)

export const fetchEventDetail = createAsyncThunk(
  'events/fetchEventDetail',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsService.getEvent(eventId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch event details')
    }
  }
)

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async ({ clubId, data }: { clubId: string; data: CreateEventRequest }, { rejectWithValue }) => {
    try {
      const response = await eventsService.createEvent(clubId, data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create event')
    }
  }
)

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ eventId, data }: { eventId: string; data: UpdateEventRequest }, { rejectWithValue }) => {
    try {
      const response = await eventsService.updateEvent(eventId, data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update event')
    }
  }
)

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      await eventsService.deleteEvent(eventId)
      return eventId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete event')
    }
  }
)

export const rsvpEvent = createAsyncThunk(
  'events/rsvpEvent',
  async ({ eventId, data }: { eventId: string; data: RSVPRequest }, { rejectWithValue }) => {
    try {
      const response = await eventsService.rsvpEvent(eventId, data)
      return { eventId, attendee: response.data }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to RSVP')
    }
  }
)

export const cancelRSVP = createAsyncThunk(
  'events/cancelRSVP',
  async (eventId: string, { rejectWithValue }) => {
    try {
      await eventsService.cancelRSVP(eventId)
      return eventId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel RSVP')
    }
  }
)

export const fetchEventAttendees = createAsyncThunk(
  'events/fetchEventAttendees',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsService.getEventAttendees(eventId)
      return { eventId, attendees: response.data.attendees }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendees')
    }
  }
)

export const checkInAttendee = createAsyncThunk(
  'events/checkInAttendee',
  async ({ eventId, userId }: { eventId: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await eventsService.checkInAttendee(eventId, userId)
      return { eventId, attendee: response.data }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check in')
    }
  }
)

export const fetchEventsByDateRange = createAsyncThunk(
  'events/fetchEventsByDateRange',
  async ({ clubId, startDate, endDate }: { clubId: string; startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const response = await eventsService.getEventsByDateRange(clubId, startDate, endDate)
      return response.data.events
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch events')
    }
  }
)

const eventSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null
    },
    optimisticRSVPUpdate: (state, action: PayloadAction<{ eventId: string; status: RSVPStatus }>) => {
      const event = state.events.find((e) => e.id === action.payload.eventId)
      if (event && state.currentEvent?.id === action.payload.eventId) {
        state.currentEvent.attendees = state.currentEvent.attendees.map((a) => {
          if (a.id === 'current-user') {
            return { ...a, rsvpStatus: action.payload.status }
          }
          return a
        })
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch club events
      .addCase(fetchClubEvents.pending, (state) => {
        state.isFetching = true
        state.error = null
      })
      .addCase(fetchClubEvents.fulfilled, (state, action) => {
        state.isFetching = false
        state.events = action.payload
      })
      .addCase(fetchClubEvents.rejected, (state, action) => {
        state.isFetching = false
        state.error = action.payload as string
      })

      // Fetch event detail
      .addCase(fetchEventDetail.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchEventDetail.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentEvent = action.payload
      })
      .addCase(fetchEventDetail.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Create event
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.isLoading = false
        state.events.push(action.payload)
        state.currentEvent = action.payload
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Update event
      .addCase(updateEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex((e) => e.id === action.payload.id)
        if (index !== -1) {
          state.events[index] = action.payload
        }
        if (state.currentEvent?.id === action.payload.id) {
          state.currentEvent = action.payload
        }
      })

      // Delete event
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.events = state.events.filter((e) => e.id !== action.payload)
        if (state.currentEvent?.id === action.payload) {
          state.currentEvent = null
        }
      })

      // RSVP
      .addCase(rsvpEvent.fulfilled, (state, action) => {
        const event = state.events.find((e) => e.id === action.payload.eventId)
        if (event) {
          event.attendees = event.attendees.map((a) =>
            a.id === action.payload.attendee.id ? action.payload.attendee : a
          )
          if (!event.attendees.find((a) => a.id === action.payload.attendee.id)) {
            event.attendees.push(action.payload.attendee)
          }
        }
        if (state.currentEvent?.id === action.payload.eventId) {
          state.currentEvent = { ...state.currentEvent, ...event }
        }
      })

      // Cancel RSVP
      .addCase(cancelRSVP.fulfilled, (state, action) => {
        const event = state.events.find((e) => e.id === action.payload)
        if (event) {
          event.attendees = event.attendees.filter((a) => a.id !== 'current-user')
        }
        if (state.currentEvent?.id === action.payload) {
          state.currentEvent.attendees = state.currentEvent.attendees.filter((a) => a.id !== 'current-user')
        }
      })

      // Fetch attendees
      .addCase(fetchEventAttendees.fulfilled, (state, action) => {
        const event = state.events.find((e) => e.id === action.payload.eventId)
        if (event) {
          event.attendees = action.payload.attendees
        }
        if (state.currentEvent?.id === action.payload.eventId) {
          state.currentEvent.attendees = action.payload.attendees
        }
      })

      // Check in
      .addCase(checkInAttendee.fulfilled, (state, action) => {
        const event = state.events.find((e) => e.id === action.payload.eventId)
        if (event) {
          event.attendees = event.attendees.map((a) =>
            a.id === action.payload.attendee.id ? action.payload.attendee : a
          )
        }
        if (state.currentEvent?.id === action.payload.eventId) {
          state.currentEvent.attendees = state.currentEvent.attendees.map((a) =>
            a.id === action.payload.attendee.id ? action.payload.attendee : a
          )
        }
      })

      // Fetch by date range
      .addCase(fetchEventsByDateRange.fulfilled, (state, action) => {
        state.events = action.payload
      })
  },
})

export const { clearError, clearCurrentEvent, optimisticRSVPUpdate } = eventSlice.actions
export default eventSlice.reducer

