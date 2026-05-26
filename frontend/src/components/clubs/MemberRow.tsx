import React from 'react'
import { ClubMember, UserRole } from '@/types/index'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Crown, Trash2, ChevronDown } from 'lucide-react'

interface MemberRowProps {
  member: ClubMember
  isOwner: boolean
  canManage: boolean
  onRoleChange: (memberId: string, role: UserRole) => void
  onRemove: (memberId: string) => void
}

export const MemberRow: React.FC<MemberRowProps> = ({
  member,
  isOwner,
  canManage,
  onRoleChange,
  onRemove,
}) => {
  const [showRoleMenu, setShowRoleMenu] = React.useState(false)

  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const roleLabel = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.CLUB_ADMIN]: 'Admin',
    [UserRole.MEMBER]: 'Member',
  }

  const roleColor = {
    [UserRole.SUPER_ADMIN]: 'border-red-200 bg-red-50 text-red-700',
    [UserRole.CLUB_ADMIN]: 'border-blue-200 bg-blue-50 text-blue-700',
    [UserRole.MEMBER]: 'border-border bg-secondary text-muted-foreground',
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-10 w-10 rounded-md">
          <AvatarImage src={member.avatar} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{member.name}</p>
            {isOwner && <Crown className="h-4 w-4 text-amber-500" />}
          </div>
          <p className="truncate text-sm text-muted-foreground">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:justify-end">
        {canManage && !isOwner ? (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="gap-2"
            >
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${roleColor[member.role]}`}>
                {roleLabel[member.role]}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showRoleMenu && (
              <div className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-popover shadow-md">
                {Object.values(UserRole).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      onRoleChange(member.id, role)
                      setShowRoleMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary ${
                      member.role === role ? 'bg-secondary' : ''
                    }`}
                  >
                    {roleLabel[role]}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleColor[member.role]}`}>
            {roleLabel[member.role]}
          </span>
        )}

        {canManage && !isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(member.id)}
            className="text-destructive hover:text-destructive"
            aria-label={`Remove ${member.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
