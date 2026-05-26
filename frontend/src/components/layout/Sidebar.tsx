import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { toggleSidebar } from '@/store/slices/uiSlice'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  UserCheck,
  UserRound,
  Bell,
  Settings,
  LogOut,
  X,
  Menu,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { logoutAsync } from '@/store/slices/authSlice'

const baseNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'Personal overview' },
  { href: '/clubs', label: 'Clubs', icon: Users, hint: 'List of clubs' },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, hint: 'My tasks across clubs' },
  { href: '/events', label: 'Events', icon: Calendar, hint: 'Events' },
  { href: '/members', label: 'Members', icon: UserCheck, hint: 'People' },
  { href: '/notifications', label: 'Notifications', icon: Bell, hint: 'Updates' },
  { href: '/profile', label: 'Profile', icon: UserRound, hint: 'User profile' },
  { href: '/settings', label: 'Settings', icon: Settings, hint: 'Preferences' },
]

interface SidebarProps {
  className?: string
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen)
  const user = useAppSelector((state) => state.auth.user)

  const handleLogout = async () => {
    await dispatch(logoutAsync())
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/35 transition-opacity md:hidden',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => dispatch(toggleSidebar())}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-transparent transition-all duration-200',
          sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72',
          'md:translate-x-0',
          sidebarOpen ? 'md:w-64' : 'md:w-20',
          className
        )}
      >
        <div className="m-3 flex h-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className={cn('min-w-0', !sidebarOpen && 'md:hidden')}>
                <div className="inline-flex items-center gap-2 rounded-md border border-primary/15 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  ClubFlow
                </div>
                <h1 className="mt-3 truncate text-lg font-semibold text-foreground">
                  Workspace
                </h1>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Keep clubs, tasks, and events in sync.
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => dispatch(toggleSidebar())}
                className="shrink-0"
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Main navigation">
            {baseNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150',
                    sidebarOpen ? 'justify-start' : 'justify-center md:px-0',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors',
                      isActive
                        ? 'bg-white/15 text-current'
                        : 'bg-secondary text-muted-foreground group-hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  {sidebarOpen && (
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{item.label}</span>
                      <span
                        className={cn(
                          'block truncate text-xs',
                          isActive ? 'text-primary-foreground/75' : 'text-muted-foreground'
                        )}
                      >
                        {item.hint}
                      </span>
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-border p-3">
            <div
              className={cn(
                'rounded-lg border border-border bg-secondary/45 p-3',
                !sidebarOpen && 'md:px-2'
              )}
            >
              <div className={cn('flex items-center gap-3', !sidebarOpen && 'md:justify-center')}>
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                {sidebarOpen && user && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className={cn(
                  'mt-3 w-full text-muted-foreground hover:bg-background hover:text-foreground',
                  sidebarOpen ? 'justify-start' : 'md:justify-center'
                )}
                title={!sidebarOpen ? 'Logout' : undefined}
              >
                <LogOut className="mr-2 h-4 w-4 shrink-0 md:mr-0" />
                {sidebarOpen && <span className="md:inline">Logout</span>}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
