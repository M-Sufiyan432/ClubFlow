import React, { useState } from 'react'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { MembersTable } from '@/components/members/MembersTable'
import { InviteMemberForm } from '@/components/members/InviteMemberForm'
import { Button } from '@/components/ui/button'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addMember, removeMember } from '@/store/slices/memberSlice'
import { Member } from '@/store/slices/memberSlice'
import { Plus } from 'lucide-react'

export const Members: React.FC = () => {
  const dispatch = useAppDispatch()
  const members = useAppSelector((state) => state.members.members)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)

  const handleInviteMember = (email: string, role: 'admin' | 'moderator' | 'member') => {
    const newMember: Member = {
      id: Math.random().toString(),
      clubId: 'default-club', // In a real app, this would be set based on context
      name: email.split('@')[0],
      email,
      role,
      joinedAt: new Date().toISOString(),
      status: 'pending',
    }
    dispatch(addMember(newMember))
    setShowInviteForm(false)
  }

  const handleDeleteMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      dispatch(removeMember(memberId))
    }
  }

  const handleEditMember = (member: Member) => {
    setEditingMember(member)
    // In a real app, you'd show an edit form here
  }

  const handleCancelInvite = () => {
    setShowInviteForm(false)
  }

  return (
    <BaseLayout title="Members">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Member Management</h1>
            <p className="text-muted-foreground">
              Manage club members and invitations.
            </p>
          </div>
          <Button onClick={() => setShowInviteForm(!showInviteForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        {showInviteForm && (
          <InviteMemberForm
            onSubmit={handleInviteMember}
            onCancel={handleCancelInvite}
          />
        )}

        {members.length === 0 && !showInviteForm ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No members yet.</p>
            <Button onClick={() => setShowInviteForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Invite Your First Member
            </Button>
          </div>
        ) : (
          <MembersTable
            members={members}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
          />
        )}
      </div>
    </BaseLayout>
  )
}
