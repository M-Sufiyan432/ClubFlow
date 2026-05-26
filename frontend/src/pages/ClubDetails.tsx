import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchClubDetail,
  updateClub,
  inviteMember,
  updateMemberRole,
  removeMember,
  setActiveClub,
} from '@/store/slices/clubSlice'
import { UserRole, UpdateMemberRoleRequest } from '@/types/index'
import { ArrowLeft, UserPlus, Mail, Shield, Trash2, Crown } from 'lucide-react'

type TabType = 'overview' | 'members' | 'settings'

export const ClubDetails: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { currentClub, members, isLoading, error } = useAppSelector((state) => state.clubs)
  const user = useAppSelector((state) => state.auth.user)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.MEMBER)
  const [invitingId, setInvitingId] = useState<string | null>(null)

  useEffect(() => {
    if (clubId) {
      dispatch(fetchClubDetail(clubId))
    }
  }, [clubId, dispatch])

  useEffect(() => {
    if (currentClub) {
      dispatch(setActiveClub(currentClub))
    }
  }, [currentClub, dispatch])

  if (!clubId) {
    return (
      <BaseLayout title="Club">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Club not found</p>
        </div>
      </BaseLayout>
    )
  }

  if (isLoading) {
    return (
      <BaseLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </BaseLayout>
    )
  }

  if (!currentClub) {
    return (
      <BaseLayout title="Club">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load club</p>
        </div>
      </BaseLayout>
    )
  }

  const isOwner = currentClub.owner.id === user?.id
  const userMember = members.find((m) => m.userId === user?.id)
  const isAdmin = userMember?.role === UserRole.CLUB_ADMIN
  const canManageMembers = isOwner || isAdmin
  const canManageSettings = isOwner

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInvitingId(inviteEmail)
    try {
      await dispatch(
        inviteMember({
          clubId,
          data: { email: inviteEmail, role: inviteRole },
        })
      ).unwrap()
      setInviteEmail('')
      setInviteRole(UserRole.MEMBER)
      setShowInviteModal(false)
    } catch (err) {
      console.error('[v0] Failed to invite member:', err)
    } finally {
      setInvitingId(null)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: UserRole) => {
    try {
      await dispatch(
        updateMemberRole({
          clubId,
          memberId,
          data: { role: newRole },
        })
      ).unwrap()
    } catch (err) {
      console.error('[v0] Failed to update role:', err)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the club?')) return

    try {
      await dispatch(
        removeMember({
          clubId,
          memberId,
        })
      ).unwrap()
    } catch (err) {
      console.error('[v0] Failed to remove member:', err)
    }
  }

  const handleTransferOwnership = async (newOwnerId: string) => {
    if (!confirm('Transfer ownership to this member? You will become an admin.')) return

    try {
      await dispatch(
        updateMemberRole({
          clubId,
          memberId: newOwnerId,
          data: { role: UserRole.CLUB_ADMIN },
        })
      ).unwrap()
    } catch (err) {
      console.error('[v0] Failed to transfer ownership:', err)
    }
  }

  return (
    <BaseLayout title={currentClub.name}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/clubs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{currentClub.name}</h1>
            <p className="text-muted-foreground">Owner: {currentClub.owner.name}</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
        )}

        <div className="flex gap-2 border-b border-border">
          {(['overview', 'members', 'settings'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p>{currentClub.description}</p>
                </div>
                {currentClub.category && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <p className="capitalize">{currentClub.category}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Members</p>
                  <p>{currentClub.memberCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p>{new Date(currentClub.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            {canManageMembers && (
              <Button onClick={() => setShowInviteModal(!showInviteModal)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            )}

            {showInviteModal && canManageMembers && (
              <Card>
                <CardHeader>
                  <CardTitle>Invite Member</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInviteMember} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background mt-1"
                        placeholder="member@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background mt-1"
                      >
                        <option value={UserRole.MEMBER}>Member</option>
                        {isOwner && (
                          <option value={UserRole.CLUB_ADMIN}>Admin</option>
                        )}
                      </select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={invitingId === inviteEmail}>
                        {invitingId === inviteEmail ? 'Sending...' : 'Send Invite'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowInviteModal(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>
                          <span className="text-xs px-2 py-1 bg-secondary rounded capitalize">
                            {member.role}
                          </span>
                          {member.userId === currentClub.owner.id && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>

                      {canManageMembers && member.userId !== user?.id && (
                        <div className="flex gap-2">
                          {isOwner && member.userId !== currentClub.owner.id && (
                            <>
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  handleUpdateRole(member.id, e.target.value as UserRole)
                                }
                                className="px-2 py-1 text-sm border border-border rounded bg-background"
                              >
                                <option value={UserRole.MEMBER}>Member</option>
                                <option value={UserRole.CLUB_ADMIN}>Admin</option>
                              </select>
                              {member.role === UserRole.CLUB_ADMIN && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleTransferOwnership(member.id)}
                                  title="Transfer ownership"
                                >
                                  <Crown className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && canManageSettings && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Club Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentClub.settings && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Privacy</label>
                      <p className="text-sm text-muted-foreground">
                        {currentClub.settings.isPrivate ? 'Private' : 'Public'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Public Join</label>
                      <p className="text-sm text-muted-foreground">
                        {currentClub.settings.allowPublicJoin ? 'Allowed' : 'Not Allowed'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Approval Required</label>
                      <p className="text-sm text-muted-foreground">
                        {currentClub.settings.requireApproval ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && !canManageSettings && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">You don't have permission to manage settings</p>
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
