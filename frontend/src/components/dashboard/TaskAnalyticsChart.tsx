import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskAnalytics } from '@/types/index'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface TaskAnalyticsChartProps {
  data: TaskAnalytics | null
  isLoading: boolean
}

const COLORS = ['#0ea5e9', '#f59e0b', '#ef4444']

export const TaskAnalyticsChart: React.FC<TaskAnalyticsChartProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="h-80 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="h-80 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const priorityData = [
    { name: 'High', value: data.byPriority.high, fill: '#ef4444' },
    { name: 'Medium', value: data.byPriority.medium, fill: '#f59e0b' },
    { name: 'Low', value: data.byPriority.low, fill: '#0ea5e9' },
  ]

  const trendData = data.completionTrendData.slice(-14) // Last 14 days

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Completion Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Trend</CardTitle>
          <CardDescription>Last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip
                contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#0ea5e9"
                dot={{ fill: '#0ea5e9', r: 4 }}
                strokeWidth={2}
                name="Completion Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Priority</CardTitle>
          <CardDescription>{data.totalTasks} total tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tasks by Status</CardTitle>
          <CardDescription>Current task distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(data.byStatus).map(([status, count]) => ({ status, count }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Assignees */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Top Performing Members</CardTitle>
          <CardDescription>By task completion rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topAssignees.slice(0, 5).map((assignee) => (
              <div key={assignee.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {assignee.avatar && (
                    <img
                      src={assignee.avatar}
                      alt={assignee.name}
                      className="h-8 w-8 rounded-full bg-muted"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{assignee.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignee.tasksCompleted} / {assignee.taskCount} tasks
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">
                    {(assignee.completionRate * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
