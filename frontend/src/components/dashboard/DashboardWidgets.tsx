import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface DashboardMetricWidgetProps {
  label: string
  value: string | number
  hint: string
}

export const DashboardMetricWidget: React.FC<DashboardMetricWidgetProps> = ({ label, value, hint }) => (
  <Card className="border-white/40 bg-white/80 dark:border-white/10 dark:bg-slate-900/60">
    <CardContent className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
    </CardContent>
  </Card>
)

