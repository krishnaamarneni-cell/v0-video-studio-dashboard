import { Badge } from '@/components/ui/badge'
import { StatusType } from '@/lib/types'

interface StatusBadgeProps {
  status: StatusType
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    pending: { label: 'Pending', className: 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30' },
    approved: { label: 'Approved', className: 'bg-blue-500/20 text-blue-200 border-blue-500/30' },
    posted: { label: 'Posted', className: 'bg-green-500/20 text-green-200 border-green-500/30' },
    skipped: { label: 'Skipped', className: 'bg-gray-500/20 text-gray-200 border-gray-500/30' },
    ready: { label: 'Ready', className: 'bg-purple-500/20 text-purple-200 border-purple-500/30' },
  }

  const { label, className } = variants[status]

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
