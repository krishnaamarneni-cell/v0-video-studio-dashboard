import { Card } from '@/components/ui/card'
import { ActivityItemComponent } from './activity-item'

interface RecentActivityCardProps {
  activities?: any[]
}

export function RecentActivityCard({ activities = [] }: RecentActivityCardProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">Recent Activity</h2>
      <div className="space-y-0">
        {activities.slice(0, 5).map((item, idx) => (
          <ActivityItemComponent key={item.id || idx} item={item} />
        ))}
        {activities.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No recent activity</p>
        )}
      </div>
    </Card>
  )
}
