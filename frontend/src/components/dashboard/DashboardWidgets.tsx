import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface DashboardMetricWidgetProps {
  label: string
  value: string | number
  hint: string
}

export const DashboardMetricWidget: React.FC<DashboardMetricWidgetProps> = ({ label, value, hint }) => (
  <Card>
    <CardContent className="p-5">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
    </CardContent>
  </Card>
)
