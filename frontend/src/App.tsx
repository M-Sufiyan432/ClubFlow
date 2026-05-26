import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { verifySession } from '@/store/slices/authSlice'
import { fetchClubs, setActiveClub } from '@/store/slices/clubSlice'
import { disconnectSocket } from '@/services/socket'
import { useSocketIO } from '@/hooks/useSocketIO'
import { Toast } from '@/components/ui/toast'
import { isSystemAdmin } from '@/utils/rbac'

// Pages
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { ResetPassword } from '@/pages/ResetPassword'
import { Dashboard } from '@/pages/Dashboard'
import { ClubsList } from '@/pages/ClubsList'
import { ClubDetails } from '@/pages/ClubDetails'
import { Profile } from '@/pages/Profile'
import { Tasks } from '@/pages/Tasks'
import { Events } from '@/pages/Events'
import { EventDetail } from '@/pages/EventDetail'
import { Members } from '@/pages/Members'
import { Notifications } from '@/pages/Notifications'
import { Settings } from '@/pages/Settings'
import { NotFound } from '@/pages/NotFound'
import { Forbidden } from '@/pages/Forbidden'

function AppContent() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const { clubs, activeClub } = useAppSelector((state) => state.clubs)

  useEffect(() => {
    if (isAuthenticated && clubs.length === 0) {
      dispatch(fetchClubs())
    }
  }, [dispatch, isAuthenticated, clubs.length])

  useEffect(() => {
    if (!isAuthenticated || clubs.length === 0 || !Array.isArray(user?.clubs) || user.clubs.length === 0) {
      return
    }

    const userClubIds = user.clubs
      .map((membership) => {
        const club = membership.club
        return typeof club === 'string' ? club : club?.id || club?._id
      })
      .filter(Boolean)

    if (activeClub?.id && userClubIds.includes(activeClub.id)) {
      return
    }

    const nextActiveClub = clubs.find((club) => userClubIds.includes(club.id))
    if (nextActiveClub) {
      dispatch(setActiveClub(nextActiveClub))
    }
  }, [activeClub?.id, clubs, dispatch, isAuthenticated, user?.clubs])

  // Initialize socket when authenticated
  useSocketIO()

  // Cleanup socket on logout
  useEffect(() => {
    return () => {
      if (!isAuthenticated) {
        disconnectSocket()
      }
    }
  }, [isAuthenticated])

  return (
    <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {isSystemAdmin(user) ? <Navigate to="/admin/dashboard" replace /> : <Dashboard />}
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs"
            element={
              <ProtectedRoute>
                <ClubsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs/:clubId"
            element={
              <ProtectedRoute>
                <ClubDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs/:clubId/tasks"
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <ProtectedRoute>
                <EventDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <RoleGuard allowAdmin allowedClubRoles={['president', 'vicepresident', 'secretary']}>
                  <Members />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowAdmin>
                  <Dashboard />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Error Pages */}
          <Route path="/forbidden" element={<Forbidden />} />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  const dispatch = useAppDispatch()

  // Verify session on app load
  useEffect(() => {
    dispatch(verifySession())
  }, [dispatch])

  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <AppContent />
          <Toast />
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
