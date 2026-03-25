'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { StatsCard } from '@/components/dashboard/stats-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentActivityCard } from '@/components/dashboard/recent-activity-card'
import { mockStats } from '@/lib/constants'
import { BarChart3, CheckCircle, Zap, TrendingUp } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back to your video studio</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Pending Videos"
              value={mockStats.pending}
              icon={<BarChart3 size={24} />}
              variant="pending"
            />
            <StatsCard
              label="Approved Videos"
              value={mockStats.approved}
              icon={<CheckCircle size={24} />}
              variant="approved"
            />
            <StatsCard
              label="Posted Today"
              value={mockStats.postedToday}
              icon={<Zap size={24} />}
              variant="posted"
            />
            <StatsCard
              label="Total Posted"
              value={mockStats.totalPosted}
              icon={<TrendingUp size={24} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <QuickActions />
            </div>
            <RecentActivityCard />
          </div>
        </div>
      </main>
    </div>
  )
}
