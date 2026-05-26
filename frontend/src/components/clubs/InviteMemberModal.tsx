import React, { useState } from 'react'
import { UserRole } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'

interface InviteMemberModalProps {
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onSubmit: (email: string, role: UserRole) => Promise<void>
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  isLoading,
  onClose,
  onSubmit,
}) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>(UserRole.MEMBER)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      await onSubmit(email, role)
      setSuccess('Invitation sent successfully!')
      setTimeout(() => {
        setEmail('')
        setRole(UserRole.MEMBER)
        setSuccess('')
        onClose()
      }, 2000)
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to send invitation')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Invite Member</CardTitle>
            <CardDescription>Add a new member to your club</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                disabled={isLoading}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value={UserRole.MEMBER}>Member</option>
                <option value={UserRole.CLUB_ADMIN}>Admin</option>
              </select>
            </div>

            {success && (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
