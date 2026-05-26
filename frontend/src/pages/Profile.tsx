import React, { useMemo, useRef, useState } from 'react'
import { Camera, Save, UserRound } from 'lucide-react'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setUser } from '@/store/slices/authSlice'
import { authService } from '@/services/auth.service'

const maxImageSize = 2 * 1024 * 1024

export const Profile: React.FC = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(user?.name || '')
  const [profilePhoto, setProfilePhoto] = useState(user?.avatar || '')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const initials = useMemo(
    () =>
      user?.name
        ?.split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'U',
    [user?.name]
  )

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setError('')
    setMessage('')

    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file')
      return
    }
    if (file.size > maxImageSize) {
      setError('Image must be smaller than 2 MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setProfilePhoto(String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    setIsSaving(true)
    try {
      const response = await authService.updateProfile({
        name: name.trim(),
        profilePhoto,
      })

      if (response.data?.user) {
        dispatch(setUser(response.data.user))
      }
      setMessage('Profile updated successfully')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <BaseLayout title="Profile">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">Update your name and profile image.</p>
        </div>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
            <CardDescription>These details appear across your ClubFlow workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <Avatar className="h-28 w-28 border border-white/40 shadow-sm">
                  <AvatarImage src={profilePhoto} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>

                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Camera className="mr-2 h-4 w-4" />
                      Choose image
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setProfilePhoto('')}>
                      <UserRound className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">PNG, JPG, or WEBP under 2 MB.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" value={user?.email || ''} disabled />
                </div>
              </div>

              {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
              {message && <div className="p-3 bg-emerald-500/10 text-emerald-700 text-sm rounded-md">{message}</div>}

              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </BaseLayout>
  )
}
