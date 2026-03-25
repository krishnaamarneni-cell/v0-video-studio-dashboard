'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { FilterTabs } from '@/components/queue/filter-tabs'
import { VideoCard } from '@/components/queue/video-card'
import { EmptyState } from '@/components/queue/empty-state'
import { useQueue } from '@/hooks/use-data'
import { StatusType } from '@/lib/types'
import { Loader2 } from 'lucide-react'

export default function QueuePage() {
  const [filter, setFilter] = useState<StatusType | 'all'>('all')
  const { videos, isLoading } = useQueue(filter)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Queue</h1>
            <p className="text-muted-foreground mt-2">Manage your video queue and posting schedule</p>
          </div>

          <FilterTabs onFilterChange={setFilter} />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  )
}
