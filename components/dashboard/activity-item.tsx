import { ActivityItem } from '@/lib/types'
import { StatusBadge } from './status-badge'
import { formatSafeDate } from '@/lib/format-date'

interface ActivityItemProps {
  item: ActivityItem
}

export function ActivityItemComponent({ item }: ActivityItemProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-card-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatSafeDate(item.timestamp, 'MMM dd, HH:mm')}
        </p>
      </div>
      <StatusBadge status={item.status} />
    </div>
  )
}
