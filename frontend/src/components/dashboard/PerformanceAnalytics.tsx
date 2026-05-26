import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PerformanceAnalytics as PerformanceAnalyticsType } from '@/types/index'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PerformanceAnalyticsProps {
  data: PerformanceAnalyticsType | null
  isLoading: boolean
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ data, isLoading }) => {
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

  const timeSeriesData = data.timeSeriesData.slice(-30) // Last 30 days

  return (
    <div className="space-y-6">
      {/* Overall Productivity Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Trend</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="overallProductivity"
                stroke="#0ea5e9"
                fillOpacity={1}
                fill="url(#colorProductivity)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Club Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Club Performance Metrics</CardTitle>
          <CardDescription>Task completion and engagement by club</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.clubPerformance.map((club) => (
              <div key={club.clubId} className="border-b border-border pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{club.clubName}</p>
                    <p className="text-xs text-muted-foreground">
                      {club.activeMembers} / {club.memberCount} active members
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {(club.taskCompletionRate * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">completion</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${club.taskCompletionRate * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Member Productivity */}
      <Card>
        <CardHeader>
          <CardTitle>Top Members by Productivity</CardTitle>
          <CardDescription>Ranked by productivity score</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.memberProductivity
                .sort((a, b) => b.productivityScore - a.productivityScore)
                .slice(0, 10)
                .map((member) => ({
                  name: member.name,
                  score: Math.round(member.productivityScore),
                  completed: member.tasksCompleted,
                  attended: member.eventAttendance,
                }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }} />
              <Legend />
              <Bar dataKey="score" fill="#0ea5e9" radius={[8, 8, 0, 0]} name="Productivity Score" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Member Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Member Details</CardTitle>
          <CardDescription>Individual performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-2 font-semibold">Member</th>
                  <th className="text-center py-2 font-semibold">Tasks Done</th>
                  <th className="text-center py-2 font-semibold">Events</th>
                  <th className="text-center py-2 font-semibold">Avg Days</th>
                  <th className="text-right py-2 font-semibold">Score</th>
                </tr>
              </thead>
              <tbody>
                {data.memberProductivity.slice(0, 10).map((member) => (
                  <tr key={member.memberId} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {member.avatar && (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="h-6 w-6 rounded-full bg-muted"
                          />
                        )}
                        <span className="font-medium truncate">{member.name}</span>
                      </div>
                    </td>
                    <td className="text-center">{member.tasksCompleted}</td>
                    <td className="text-center">{member.eventAttendance}</td>
                    <td className="text-center">{member.averageTaskCompletionDays.toFixed(1)}</td>
                    <td className="text-right font-semibold">{Math.round(member.productivityScore)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
