import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { UserRole } from '@/types/index'
import {
  fetchClubDetail,
  fetchClubMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  clearError,
} from '@/store/slices/clubSlice'
import { InviteMemberRequest, UpdateMemberRoleRequest } from '@/types/index'

export const useClub = (clubId?: string) => {
  const dispatch = useAppDispatch()
  const { currentClub, members, isLoading, error } = useAppSelector(
    (state) => state.clubs
  )
  const user = useAppSelector((state) => state.auth.user)

  const getCurrentUserRole = () => {
    if (!currentClub || !user) return null
    const member = members.find((m) => m.userId === user.id)
    return member?.role || null
  }

  const isAdmin = () => {
    const role = getCurrentUserRole()
    return role === UserRole.CLUB_ADMIN || role === UserRole.SUPER_ADMIN
  }

  const isOwner = () => {
    return currentClub?.owner.id === user?.id
  }

  const canManageMembers = () => {
    return isOwner() || getCurrentUserRole() === UserRole.CLUB_ADMIN
  }

  const loadClub = async (id: string) => {
    return dispatch(fetchClubDetail(id)).unwrap()
  }

  const loadMembers = async (id: string) => {
    return dispatch(fetchClubMembers(id)).unwrap()
  }

  const inviteUser = async (email: string, role: UserRole) => {
    if (!currentClub) throw new Error('No club selected')
    return dispatch(
      inviteMember({
        clubId: currentClub.id,
        data: { email, role },
      })
    ).unwrap()
  }

  const updateRole = async (memberId: string, role: UserRole) => {
    if (!currentClub) throw new Error('No club selected')
    return dispatch(
      updateMemberRole({
        clubId: currentClub.id,
        memberId,
        data: { role },
      })
    ).unwrap()
  }

  const removeMemberFromClub = async (memberId: string) => {
    if (!currentClub) throw new Error('No club selected')
    return dispatch(
      removeMember({
        clubId: currentClub.id,
        memberId,
      })
    ).unwrap()
  }

  return {
    currentClub,
    members,
    isLoading,
    error,
    user,
    getCurrentUserRole,
    isAdmin,
    isOwner,
    canManageMembers,
    loadClub,
    loadMembers,
    inviteUser,
    updateRole,
    removeMemberFromClub,
    clearError: () => dispatch(clearError()),
  }
}
