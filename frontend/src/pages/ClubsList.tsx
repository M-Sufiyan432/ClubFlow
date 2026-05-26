import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { ClubCard } from '@/components/clubs/ClubCard'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchClubs, createClub, joinClub, setActiveClub } from '@/store/slices/clubSlice'
import { CreateClubRequest } from '@/types/index'
import { Plus } from 'lucide-react'

export const ClubsList: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { clubs, isFetching, isLoading, error } = useAppSelector((state) => state.clubs)
  const user = useAppSelector((state) => state.auth.user)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateClubRequest>({
    name: '',
    description: '',
    category: '',
  })

  useEffect(() => {
    dispatch(fetchClubs())
  }, [dispatch])

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.description.trim()) {
      return
    }

    try {
      const result = await dispatch(createClub(formData)).unwrap()
      dispatch(setActiveClub(result))
      setFormData({ name: '', description: '', category: '' })
      setShowCreateModal(false)
      navigate(`/clubs/${result.id}`)
    } catch (err) {
      console.error('[v0] Failed to create club:', err)
    }
  }

  const handleSelectClub = (clubId: string) => {
    const club = clubs.find((c) => c.id === clubId)
    if (club) {
      dispatch(setActiveClub(club))
      navigate(`/clubs/${clubId}`)
    }
  }

  const handleJoinClub = async (clubId: string) => {
    setJoiningClubId(clubId)
    try {
      const club = await dispatch(joinClub(clubId)).unwrap()
      dispatch(setActiveClub(club))
      navigate(`/clubs/${club.id}`)
    } catch (err) {
      console.error('[v0] Failed to join club:', err)
    } finally {
      setJoiningClubId(null)
    }
  }

  return (
    <BaseLayout title="Clubs">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Clubs</h1>
            <p className="text-muted-foreground">Manage and explore your clubs</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Club
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
        )}

        {showCreateModal && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Club</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateClub} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Club Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
                    placeholder="Enter club name"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1 min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
                    placeholder="Describe your club"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
                  >
                    <option value="">Select a category</option>
                    <option value="sports">Sports</option>
                    <option value="hobby">Hobby</option>
                    <option value="professional">Professional</option>
                    <option value="social">Social</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit">Create Club</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isFetching ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard count={6} />
          </div>
        ) : clubs.length === 0 ? (
          <div className="rounded-lg border border-border bg-card py-12 text-center shadow-xs">
            <p className="text-muted-foreground mb-4">No clubs yet</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Club
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clubs.map((club) => (
              <div key={club.id} onClick={() => handleSelectClub(club.id)}>
                <ClubCard
                  club={club}
                  currentUserId={user?.id}
                  isJoining={joiningClubId === club.id && isLoading}
                  onJoin={handleJoinClub}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
