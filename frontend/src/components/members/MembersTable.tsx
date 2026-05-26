import React from 'react'
import { Member } from '@/store/slices/memberSlice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Edit2, Trash2, Mail } from 'lucide-react'
import { format } from 'date-fns'

interface MembersTableProps {
  members: Member[]
  onEdit: (member: Member) => void
  onDelete: (memberId: string) => void
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'moderator':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    default:
      return 'border-border bg-secondary text-muted-foreground'
  }
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'border-green-200 bg-green-50 text-green-700'
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    default:
      return 'border-border bg-secondary text-muted-foreground'
  }
}

export const MembersTable: React.FC<MembersTableProps> = ({
  members,
  onEdit,
  onDelete,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-border transition-colors last:border-0 hover:bg-secondary/60">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-md">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </a>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(
                        member.status
                      )}`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(member)}
                        aria-label={`Edit ${member.name}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(member.id)}
                        aria-label={`Delete ${member.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
