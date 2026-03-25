import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function PostingSettings() {
  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Posting Settings</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-post" className="text-card-foreground">
            Enable Auto-Posting
          </Label>
          <Switch id="auto-post" defaultChecked />
        </div>

        <div>
          <Label htmlFor="max-posts" className="text-card-foreground mb-2 block">
            Max Posts Per Day
          </Label>
          <Input
            id="max-posts"
            type="number"
            defaultValue="3"
            min="1"
            max="10"
            className="bg-input border-border text-card-foreground"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="add-logo" className="text-card-foreground">
            Add Logo to Videos
          </Label>
          <Switch id="add-logo" defaultChecked />
        </div>
      </div>
    </Card>
  )
}
