'use client'

import { useState } from 'react'
import { DateFilter } from '@/components/history/date-filter'
import { HistoryTable } from '@/components/history/history-table'
import { useActivity } from '@/hooks/use-data'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function HistoryPage() {
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({})
  const { activities, isLoading } = useActivity(dateRange.from, dateRange.to)

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">History</h1>
          <p className="text-muted-foreground mt-2">View your posting history and performance</p>
        </div>

        <DateFilter onFilterChange={setDateRange} />

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <HistoryTable videos={activities} />
          )}
        </Card>
      </div>
    </div>
  )
}
