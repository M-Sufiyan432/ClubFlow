import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, X } from 'lucide-react'
import { subDays, format, startOfMonth, endOfMonth } from 'date-fns'

interface DashboardDateFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void
  onReset: () => void
  currentRange?: { startDate: string; endDate: string } | null
}

export const DashboardDateFilter: React.FC<DashboardDateFilterProps> = ({
  onDateRangeChange,
  onReset,
  currentRange,
}) => {
  const [showCustom, setShowCustom] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const today = new Date()
  const quickFilters = [
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 },
    { label: 'This month', value: 'thisMonth' },
    { label: 'Last month', value: 'lastMonth' },
  ]

  const handleQuickFilter = (value: number | string) => {
    let start, end

    if (value === 'thisMonth') {
      start = startOfMonth(today)
      end = endOfMonth(today)
    } else if (value === 'lastMonth') {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1)
      start = startOfMonth(lastMonth)
      end = endOfMonth(lastMonth)
    } else {
      start = subDays(today, value as number)
      end = today
    }

    onDateRangeChange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'))
    setShowCustom(false)
  }

  const handleCustomFilter = () => {
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate)
      setShowCustom(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Date Range</h3>
        {currentRange && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs">
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <Button
            key={filter.label}
            variant={currentRange ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => handleQuickFilter(filter.value)}
            className="text-xs"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {showCustom ? (
        <Card className="p-3">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 border border-border rounded text-sm bg-background"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 border border-border rounded text-sm bg-background"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCustomFilter}
                disabled={!startDate || !endDate}
                className="flex-1 text-xs"
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCustom(false)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustom(true)}
          className="w-full text-xs"
        >
          <Calendar className="h-3 w-3 mr-1" />
          Custom Range
        </Button>
      )}
    </div>
  )
}
