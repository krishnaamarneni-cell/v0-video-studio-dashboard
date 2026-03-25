import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Platform } from '@/lib/types'
import { Youtube, Twitter, Instagram, Linkedin } from 'lucide-react'

interface ConnectedAccountCardProps {
  platform: Platform
  connected: boolean
  username?: string
}

export function ConnectedAccountCard({ platform, connected, username }: ConnectedAccountCardProps) {
  const platformConfig = {
    youtube: { label: 'YouTube', icon: Youtube, color: 'text-red-500' },
    twitter: { label: 'Twitter', icon: Twitter, color: 'text-blue-400' },
    instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  }

  const config = platformConfig[platform]
  const Icon = config.icon

  return (
    <Card className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon size={24} className={config.color} />
        <div>
          <p className="font-medium text-card-foreground">{config.label}</p>
          {username && (
            <p className="text-xs text-muted-foreground">@{username}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {connected && (
          <Badge className="bg-green-500/20 text-green-200 border-green-500/30">
            Connected
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          className="border-border text-accent-foreground"
        >
          {connected ? 'Disconnect' : 'Connect'}
        </Button>
      </div>
    </Card>
  )
}
