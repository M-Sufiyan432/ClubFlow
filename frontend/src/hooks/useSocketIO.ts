import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
  initializeSocket,
  disconnectSocket,
  joinClubRoom,
  leaveClubRoom,
} from '@/services/socket'

/**
 * Hook to manage Socket.IO connection lifecycle
 * Automatically connects after authentication and joins the active club room
 * Handles reconnection and cleanup on logout
 */
export const useSocketIO = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, token } = useAppSelector((state) => state.auth)
  const { activeClub } = useAppSelector((state) => state.clubs)

  // Initialize socket connection after authentication
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('[useSocketIO] Initializing socket connection')
      initializeSocket(token, activeClub?.id)
    }

    return () => {
      // Cleanup happens in App.tsx on logout
    }
  }, [isAuthenticated, token])

  // Join/leave club room when active club changes
  useEffect(() => {
    if (activeClub?.id) {
      console.log('[useSocketIO] Active club changed, joining room:', activeClub.id)
      joinClubRoom(activeClub.id)
    }
  }, [activeClub?.id])

  return {
    isConnected: isAuthenticated,
    clubId: activeClub?.id,
  }
}
