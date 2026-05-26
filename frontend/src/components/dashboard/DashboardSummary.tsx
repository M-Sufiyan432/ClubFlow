import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardSummary as DashboardSummaryType } from '@/types/index'
import { AlertCircle, CheckCircle2, Calendar, Bell, TrendingUp } from 'lucide-react'

interface DashboardSummaryProps {
  data: DashboardSummaryType | null
  isLoading: boolean
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-8 animate-pulse rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = [
    {
      label: 'Assigned Tasks',
      value: data.assignedTasks,
      icon: CheckCircle2,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Overdue',
      value: data.overdueTasks,
      icon: AlertCircle,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Upcoming Events',
      value: data.upcomingEvents,
      icon: Calendar,
      color: 'text-green-700',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Notifications',
      value: data.unreadNotifications,
      icon: Bell,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Productivity',
      value: `${Math.round(data.productivityScore)}%`,
      icon: TrendingUp,
      color: 'text-violet-700',
      bgColor: 'bg-violet-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="transition-colors hover:border-primary/25">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`${stat.bgColor} rounded-md p-2`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.label === 'Overdue' ? 'Needs attention' : 'Overall'}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
