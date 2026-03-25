'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DateFilter } from '@/components/history/date-filter'
import { HistoryTable } from '@/components/history/history-table'
import { mockVideos } from '@/lib/constants'
import { Card } from '@/components/ui/card'

export default function HistoryPage() {
  const [dateFilter, setDateFilter] = useState<string>('7d')

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">History</h1>
            <p className="text-muted-foreground mt-2">View your posting history and performance</p>
          </div>

          <DateFilter onFilterChange={setDateFilter} />

          <Card className="overflow-hidden">
            <HistoryTable videos={mockVideos} />
          </Card>
        </div>
      </main>
    </div>
  )
}
