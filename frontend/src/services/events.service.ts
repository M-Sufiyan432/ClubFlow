import api from './api'
import { Event, CreateEventRequest, UpdateEventRequest, RSVPRequest, EventAttendee } from '@/types/index'
import { mapEvent, mapEventAttendee, wrapData, unwrapApiData } from './adapters'

export const eventsService = {
  // Event CRUD
  listEvents: async (clubId: string, params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }) => {
    const response = await api.get('/events', {
      params: { ...params, club: clubId },
    })
    const events = (unwrapApiData<any[]>(response) || []).map(mapEvent)
    return wrapData({ events, total: response.data?.total || events.length })
  },

  getEvent: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}`)
    return wrapData(mapEvent(unwrapApiData(response)))
  },

  createEvent: async (clubId: string, data: CreateEventRequest) => {
    const response = await api.post('/events', {
      title: data.title,
      description: data.description,
      club: clubId,
      clubId,
      startDate: data.startDateTime,
      endDate: data.endDateTime,
      capacity: data.capacity,
      location: {
        type: 'physical',
        address: data.location,
      },
      image: data.image,
    })
    return wrapData(mapEvent(unwrapApiData(response)))
  },

  updateEvent: async (eventId: string, data: UpdateEventRequest) => {
    const response = await api.put(`/events/${eventId}`, {
      title: data.title,
      description: data.description,
      startDate: data.startDateTime,
      endDate: data.endDateTime,
      capacity: data.capacity,
      location: data.location
        ? {
            type: 'physical',
            address: data.location,
          }
        : undefined,
      image: data.image,
      status: data.status,
    })
    return wrapData(mapEvent(unwrapApiData(response)))
  },

  deleteEvent: (eventId: string) =>
    api.post(`/events/${eventId}/cancel`),

  // RSVP Management
  rsvpEvent: async (eventId: string, data: RSVPRequest) => {
    const status =
      data.status === 'interested' ? 'maybe' : data.status === 'not_going' ? 'not_going' : 'going'
    const response = await api.post(`/events/${eventId}/rsvp`, { status })
    return wrapData(mapEventAttendee(unwrapApiData(response)))
  },

  cancelRSVP: (eventId: string) =>
    api.post(`/events/${eventId}/rsvp`, { status: 'not_going' }),

  // Attendance Tracking
  getEventAttendees: async (eventId: string) => {
    const response = await eventsService.getEvent(eventId)
    return wrapData({ attendees: response.data.attendees || [] })
  },

  checkInAttendee: async (eventId: string, userId: string) => {
    const response = await api.post(`/events/${eventId}/attendance`, { userId })
    return wrapData(mapEventAttendee(unwrapApiData(response)))
  },

  getUserEvents: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ events: Event[]; total: number }>('/events/my', { params }),

  getEventsByDateRange: async (clubId: string, startDate: string, endDate: string) => {
    const response = await eventsService.listEvents(clubId, { dateFrom: startDate, dateTo: endDate })
    return wrapData({ events: response.data.events })
  },
}
