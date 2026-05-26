import React, { useState } from 'react'
import { Club, CreateClubRequest } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ClubFormProps {
  club?: Club
  onSubmit: (data: CreateClubRequest) => void
  onCancel: () => void
  isLoading?: boolean
}

interface FormErrors {
  name?: string
  description?: string
}

export const ClubForm: React.FC<ClubFormProps> = ({
  club,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: club?.name || '',
    description: club?.description || '',
    image: club?.image || '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Club name is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({
        name: formData.name,
        description: formData.description,
        logo: formData.image,
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{club ? 'Edit Club' : 'Create New Club'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Club Name *
            </label>
            <Input
              id="name"
              name="name"
              placeholder="Enter club name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter club description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={4}
              className="min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-70"
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="image" className="text-sm font-medium">
              Image URL (optional)
            </label>
            <Input
              id="image"
              name="image"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.image}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-2 pt-4 sm:flex-row">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : club ? 'Update Club' : 'Create Club'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
