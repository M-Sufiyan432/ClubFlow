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
    [UserRole.SUPER_ADMIN]: 'text-red-500 bg-red-50',
    [UserRole.CLUB_ADMIN]: 'text-blue-500 bg-blue-50',
    [UserRole.MEMBER]: 'text-gray-500 bg-gray-50',
  }

  return (
    <div className="flex items-center justify-between p-4 hover:bg-secondary/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.avatar} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{member.name}</p>
            {isOwner && <Crown className="h-4 w-4 text-amber-500" />}
          </div>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canManage && !isOwner ? (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="gap-2"
            >
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColor[member.role]}`}>
                {roleLabel[member.role]}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-40">
                {Object.values(UserRole).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      onRoleChange(member.id, role)
                      setShowRoleMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-secondary text-sm ${
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
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColor[member.role]}`}>
            {roleLabel[member.role]}
          </span>
        )}

        {canManage && !isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(member.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
