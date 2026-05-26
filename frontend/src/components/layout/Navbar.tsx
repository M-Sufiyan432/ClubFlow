import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { useTheme } from '@/contexts/ThemeContext'
import { logoutAsync } from '@/store/slices/authSlice'
import { toggleSidebar } from '@/store/slices/uiSlice'
import { fetchNotifications, getUnreadCount } from '@/store/slices/notificationSlice'
import { Moon, Sun, Bell, LogOut, Menu, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { NotificationBadge } from '@/components/notifications/NotificationBadge'

interface NavbarProps {
  title?: string
}

export const Navbar: React.FC<NavbarProps> = ({ title = 'Dashboard' }) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const { theme, toggleTheme } = useTheme()
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Load notifications on component mount
  useEffect(() => {
    dispatch(fetchNotifications({ limit: 20 }))
    dispatch(getUnreadCount())
  }, [dispatch])

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const handleLogout = async () => {
    await dispatch(logoutAsync())
    navigate('/login')
  }

  return (
    <header className="sticky right-0 top-0 z-30 border-b border-border bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4 lg:px-8">
      <div className="mx-auto flex min-h-12 w-full max-w-[1440px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(toggleSidebar())}
            className="md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Workspace</p>
            <h2 className="truncate text-base font-semibold sm:text-lg">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" />
              <NotificationBadge className="top-1 right-1" />
            </Button>
            <NotificationDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
          </div>

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
              className="relative"
              aria-label="Open user menu"
            >
              <Avatar className="h-8 w-8 rounded-md">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>

            {showMenu && (
              <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-md">
                <div className="border-b border-border p-4">
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    navigate('/profile')
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  <UserRound className="h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    handleLogout()
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
