import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { MemberRow } from '@/components/clubs/MemberRow'
import { InviteMemberModal } from '@/components/clubs/InviteMemberModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useClub } from '@/hooks/useClub'
import { useAppDispatch } from '@/store/hooks'
import { UserRole } from '@/types/index'
import { Plus, Settings, Trash2, Users } from 'lucide-react'

export const ClubDetail: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview')

  const {
    currentClub,
    members,
    isLoading,
    error,
    isOwner,
    canManageMembers,
    loadClub,
    loadMembers,
    inviteUser,
    updateRole,
    removeMemberFromClub,
  } = useClub(clubId)

  useEffect(() => {
    if (clubId) {
      loadClub(clubId).catch((err) => {
        console.error('[v0] Failed to load club:', err)
      })
    }
  }, [clubId])

  const handleInviteMember = async (email: string, role: UserRole) => {
    try {
      await inviteUser(email, role)
      if (clubId) {
        await loadMembers(clubId)
      }
    } catch (err) {
      console.error('[v0] Failed to invite member:', err)
      throw err
    }
  }

  const handleRoleChange = async (memberId: string, role: UserRole) => {
    try {
      await updateRole(memberId, role)
    } catch (err) {
      console.error('[v0] Failed to update role:', err)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMemberFromClub(memberId)
      } catch (err) {
        console.error('[v0] Failed to remove member:', err)
      }
    }
  }

  if (isLoading) {
    return (
      <BaseLayout title="Loading...">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </BaseLayout>
    )
  }

  if (!currentClub) {
    return (
      <BaseLayout title="Club Not Found">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Club not found</p>
          <Button onClick={() => navigate('/clubs')}>Back to Clubs</Button>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout title={currentClub.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{currentClub.name}</h1>
            <p className="text-muted-foreground max-w-2xl">{currentClub.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span>Owner: {currentClub.owner.name}</span>
              <span>{currentClub.memberCount} members</span>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTab('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm('Are you sure? This cannot be undone.')) {
                    // Handle delete
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Members
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{currentClub.description}</p>
              </div>
              {currentClub.settings && (
                <>
                  <div>
                    <h3 className="font-semibold mb-2">Privacy</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentClub.settings.isPrivate ? 'Private' : 'Public'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Join Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentClub.settings.allowPublicJoin
                        ? 'Anyone can join'
                        : 'Invite only'}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            {canManageMembers && (
              <Button onClick={() => setShowInviteModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {members.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      isOwner={member.userId === currentClub.owner.id}
                      canManage={canManageMembers}
                      onRoleChange={handleRoleChange}
                      onRemove={handleRemoveMember}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>Club Settings</CardTitle>
              <CardDescription>Manage your club preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentClub.settings?.isPrivate || false}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Private Club</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only invited members can join
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentClub.settings?.allowPublicJoin || false}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Allow Public Join</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Anyone can request to join
                  </p>
                </div>

                <Button className="mt-6">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <InviteMemberModal
        isOpen={showInviteModal}
        isLoading={false}
        onClose={() => setShowInviteModal(false)}
        onSubmit={handleInviteMember}
      />
    </BaseLayout>
  )
}
