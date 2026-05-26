import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { createEvent, updateEvent } from '@/store/slices/eventSlice'
import { Event, CreateEventRequest } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EventFormProps {
  clubId: string
  event?: Event
  onSuccess?: () => void
  onCancel?: () => void
}

interface FormErrors {
  title?: string
  description?: string
  location?: string
  startDateTime?: string
  endDateTime?: string
}

export const EventForm: React.FC<EventFormProps> = ({ clubId, event, onSuccess, onCancel }) => {
  const dispatch = useAppDispatch()
  const { isLoading } = useAppSelector((state) => state.events)
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    location: event?.location || '',
    startDateTime: event?.startDateTime || '',
    endDateTime: event?.endDateTime || '',
    capacity: event?.capacity?.toString() || '',
    image: event?.image || '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'
    if (!formData.startDateTime) newErrors.startDateTime = 'Start date/time is required'
    if (!formData.endDateTime) newErrors.endDateTime = 'End date/time is required'

    const start = new Date(formData.startDateTime)
    const end = new Date(formData.endDateTime)
    if (end <= start) {
      newErrors.endDateTime = 'End time must be after start time'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const data: CreateEventRequest = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        image: formData.image || undefined,
      }

      if (event) {
        await dispatch(updateEvent({ eventId: event.id, data })).unwrap()
      } else {
        await dispatch(createEvent({ clubId, data })).unwrap()
      }

      onSuccess?.()
    } catch (err) {
      console.error('[v0] Form submission error:', err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{event ? 'Edit Event' : 'Create New Event'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Event Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Enter event title"
              value={formData.title}
              onChange={handleChange}
              disabled={isLoading}
              className="h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter event description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={4}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="startDateTime" className="text-sm font-medium">
                Start Date & Time *
              </label>
              <input
                id="startDateTime"
                name="startDateTime"
                type="datetime-local"
                value={formData.startDateTime}
                onChange={handleChange}
                disabled={isLoading}
                className="h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
              />
              {errors.startDateTime && <p className="text-xs text-destructive">{errors.startDateTime}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="endDateTime" className="text-sm font-medium">
                End Date & Time *
              </label>
              <input
                id="endDateTime"
                name="endDateTime"
                type="datetime-local"
                value={formData.endDateTime}
                onChange={handleChange}
                disabled={isLoading}
                className="h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
              />
              {errors.endDateTime && <p className="text-xs text-destructive">{errors.endDateTime}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              Location *
            </label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="Enter event location"
              value={formData.location}
              onChange={handleChange}
              disabled={isLoading}
              className="h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
            />
            {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="capacity" className="text-sm font-medium">
                Capacity (optional)
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                placeholder="Max attendees"
                value={formData.capacity}
                onChange={handleChange}
                disabled={isLoading}
                min="1"
                className="h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="image" className="text-sm font-medium">
                Image URL (optional)
              </label>
              <input
                id="image"
                name="image"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.image}
                onChange={handleChange}
                disabled={isLoading}
                className="h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
