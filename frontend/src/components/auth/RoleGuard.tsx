import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { getClubRoleForClub, isSystemAdmin } from '@/utils/rbac'

interface RoleGuardProps {
  children: React.ReactNode
  allowAdmin?: boolean
  allowedClubRoles?: string[]
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowAdmin = false,
  allowedClubRoles = [],
}) => {
  const location = useLocation()
  const user = useAppSelector((state) => state.auth.user)
  const activeClubId = useAppSelector((state) => state.clubs.activeClub?.id)

  if (allowAdmin && isSystemAdmin(user)) {
    return <>{children}</>
  }

  if (allowedClubRoles.length === 0) {
    if (allowAdmin) {
      return <Navigate to="/forbidden" state={{ from: location }} replace />
    }

    return <>{children}</>
  }

  const clubRole = getClubRoleForClub(user, activeClubId)

  if (clubRole && allowedClubRoles.includes(clubRole)) {
    return <>{children}</>
  }

  return <Navigate to="/forbidden" state={{ from: location }} replace />
}
