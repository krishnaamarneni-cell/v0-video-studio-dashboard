import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StatsCardProps {
  label: string
  value: number
  icon?: React.ReactNode
  variant?: 'default' | 'pending' | 'approved' | 'posted'
}

export function StatsCard({ label, value, icon, variant = 'default' }: StatsCardProps) {
  const variants = {
    default: 'bg-card border-border',
    pending: 'bg-card border-l-4 border-l-yellow-400',
    approved: 'bg-card border-l-4 border-l-blue-500',
    posted: 'bg-card border-l-4 border-l-green-500',
  }

  return (
    <Card className={`${variants[variant]} p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <p className="text-3xl font-bold text-card-foreground">{value}</p>
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
    </Card>
  )
}
