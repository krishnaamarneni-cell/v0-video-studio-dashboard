import { Card } from '@/components/ui/card'
import { Film } from 'lucide-react'

export function EmptyState() {
  return (
    <Card className="p-12 text-center border-dashed">
      <Film size={48} className="mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-card-foreground mb-2">No videos found</h3>
      <p className="text-muted-foreground">
        Try adding a new video or adjusting your filters to see content here
      </p>
    </Card>
  )
}
