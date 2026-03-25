import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video } from '@/lib/types'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { Play, MoreVertical } from 'lucide-react'
import Image from 'next/image'

interface VideoCardProps {
  video: Video
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Card className="overflow-hidden hover:border-accent/50 transition-colors">
      <div className="aspect-video relative bg-muted overflow-hidden">
        {video.thumbnail && (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
          <span className="text-xs bg-black/50 text-white px-2 py-1 rounded">
            {video.duration}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-card-foreground line-clamp-2 mb-2">
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground">{video.source}</p>
        </div>

        <div className="flex items-center justify-between">
          <StatusBadge status={video.status} />
          <button className="text-muted-foreground hover:text-card-foreground">
            <MoreVertical size={16} />
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-border text-accent-foreground hover:bg-accent/10"
          >
            <Play size={14} />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-border text-accent-foreground hover:bg-accent/10"
          >
            Edit
          </Button>
        </div>
      </div>
    </Card>
  )
}
