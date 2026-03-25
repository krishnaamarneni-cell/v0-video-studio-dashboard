import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Play } from 'lucide-react'

export function QuickActions() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">Quick Actions</h2>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Paste YouTube URL..."
          className="bg-input border-border text-card-foreground placeholder:text-muted-foreground"
        />
        <Button className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Play size={16} />
          Process
        </Button>
      </div>
    </Card>
  )
}
