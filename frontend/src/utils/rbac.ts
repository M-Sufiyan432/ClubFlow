import { User } from '@/store/slices/authSlice'

export type ClubRole = 'president' | 'vicepresident' | 'secretary' | 'member'
export type DashboardKind = 'admin' | 'president' | 'vicepresident' | 'secretary' | 'member' | 'personal'

const ADMIN_ROLES = new Set(['admin', 'superadmin', 'super_admin'])

export const isSystemAdmin = (user?: User | null) =>
  Boolean(user?.roles?.some((role) => ADMIN_ROLES.has(role)) || (user?.role && ADMIN_ROLES.has(user.role)))

export const isAdminDashboardUser = (user?: User | null) =>
  Boolean(user?.role === 'admin' || user?.roles?.includes('admin'))

export const getClubRoleForClub = (user?: User | null, clubId?: string | null): ClubRole | null => {
  if (!user || !clubId || !Array.isArray(user.clubs)) return null

  const membership = user.clubs.find((entry) => {
    const value = entry?.club
    if (typeof value === 'string') return value === clubId
    return value?.id === clubId || value?._id === clubId
  })

  if (!membership?.role) return null

  if (['president', 'vicepresident', 'secretary', 'member'].includes(membership.role)) {
    return membership.role as ClubRole
  }

  return null
}

export const resolveDashboardKind = (user?: User | null, activeClubId?: string | null): DashboardKind => {
  if (isAdminDashboardUser(user)) return 'admin'

  const clubRole = getClubRoleForClub(user, activeClubId)

  if (clubRole === 'president') return 'president'
  if (clubRole === 'vicepresident') return 'vicepresident'
  if (clubRole === 'secretary') return 'secretary'
  if (clubRole === 'member') return 'member'

  return 'personal'
}
