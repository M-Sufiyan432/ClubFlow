import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Club, UserRole } from '@/types/index'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, ArrowRight, UserPlus, Crown, Shield } from 'lucide-react'

interface ClubCardProps {
  club: Club
  currentUserId?: string
  isJoining?: boolean
  onJoin?: (clubId: string) => void
}

export const ClubCard: React.FC<ClubCardProps> = ({
  club,
  currentUserId,
  isJoining = false,
  onJoin,
}) => {
  const navigate = useNavigate()
  const isOwner = club.owner.id === currentUserId
  const membership = club.members.find((member) => member.userId === currentUserId)
  const isAdmin =
    membership?.role === UserRole.CLUB_ADMIN || membership?.role === UserRole.SUPER_ADMIN || isOwner
  const isMember = Boolean(membership)
  const showJoin = Boolean(currentUserId) && !isOwner && !isAdmin && !isMember

  const handleJoin = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onJoin?.(club.id)
  }

  return (
    <Card className="overflow-hidden transition-colors duration-150 hover:border-primary/25 hover:shadow-sm">
      {club.image && (
        <div
          className="h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${club.image})` }}
        />
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="line-clamp-2 text-xl">{club.name}</CardTitle>
            {club.category && (
              <p className="mt-2 inline-flex rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                {club.category}
              </p>
            )}
          </div>
          {isOwner ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium">
              <Crown className="h-3.5 w-3.5" />
              Owner
            </span>
          ) : isAdmin ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium">
              <Shield className="h-3.5 w-3.5" />
              Admin
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {club.description}
        </p>

        <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{club.memberCount} members</span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/clubs/${club.id}`)}
          >
            View Club
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {showJoin && (
            <Button
              size="sm"
              onClick={handleJoin}
              disabled={isJoining}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {isJoining ? 'Joining...' : 'Join'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
