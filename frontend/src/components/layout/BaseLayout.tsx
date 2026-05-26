import React from 'react'
import { useAppSelector } from '@/store/hooks'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

interface BaseLayoutProps {
  children: React.ReactNode
  title?: string
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  title = 'Dashboard',
}) => {
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen)

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        className={[
          'flex min-w-0 flex-1 flex-col transition-all duration-300',
          sidebarOpen ? 'md:ml-64' : 'md:ml-20',
        ].join(' ')}
      >
        {/* Navbar */}
        <Navbar title={title} />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-4 lg:px-8 lg:py-6">
          <div className="page-shell relative mx-auto min-h-full w-full max-w-[1440px] min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
