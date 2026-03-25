import { Card } from '@/components/ui/card'
import { ActivityItemComponent } from './activity-item'
import { mockActivity } from '@/lib/constants'

export function RecentActivityCard() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">Recent Activity</h2>
      <div className="space-y-0">
        {mockActivity.slice(0, 5).map((item) => (
          <ActivityItemComponent key={item.id} item={item} />
        ))}
      </div>
    </Card>
  )
}
