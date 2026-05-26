import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchClubs, createClub } from '@/store/slices/clubSlice'
import { CreateClubRequest } from '@/types/index'
import { Plus, Users, Calendar } from 'lucide-react'

export const Clubs: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { clubs, isFetching, error } = useAppSelector((state) => state.clubs)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
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
      await dispatch(createClub(formData as CreateClubRequest)).unwrap()
      setFormData({ name: '', description: '', category: '' })
      setShowCreateForm(false)
    } catch (err) {
      console.error('[v0] Failed to create club:', err)
    }
  }

  return (
    <BaseLayout title="Clubs">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Clubs</h1>
            <p className="text-muted-foreground">
              Manage and explore your clubs
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Club
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Club</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateClub} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Club Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
                    placeholder="Enter club name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1 min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
                    placeholder="Describe your club"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="mt-1 h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
                  >
                    <option value="">Select a category</option>
                    <option value="sports">Sports</option>
                    <option value="hobby">Hobby</option>
                    <option value="professional">Professional</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                  <Button type="submit">Create Club</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isFetching ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : clubs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card py-12 text-center">
            <p className="text-muted-foreground mb-4">No clubs yet</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Club
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clubs.map((club) => (
              <Card
                key={club.id}
                className="cursor-pointer transition-colors hover:border-primary/25 hover:bg-accent/25"
                onClick={() => navigate(`/clubs/${club.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{club.name}</CardTitle>
                      {club.category && (
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          {club.category}
                        </p>
                      )}
                    </div>
                    {club.status === 'archived' && (
                      <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        Archived
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {club.description}
                  </p>

                  <div className="flex items-center gap-4 pt-4 border-t border-border text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {club.memberCount} members
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(club.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Owner: {club.owner.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
