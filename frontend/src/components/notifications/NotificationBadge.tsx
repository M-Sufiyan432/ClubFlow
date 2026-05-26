import React from 'react'
import { useAppSelector } from '@/store/hooks'

interface NotificationBadgeProps {
  className?: string
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className = '' }) => {
  const { unreadCount } = useAppSelector((state) => state.notifications)

  if (unreadCount === 0) return null

  return (
    <div
      className={`absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${className}`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  )
}
