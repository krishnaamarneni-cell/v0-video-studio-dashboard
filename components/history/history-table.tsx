import { Video } from '@/lib/types'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { PlatformIcon } from './platform-icon'
import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'

interface HistoryTableProps {
  videos: Video[]
}

export function HistoryTable({ videos }: HistoryTableProps) {
  const postedVideos = videos.filter((v) => v.status === 'posted')

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
              Date
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
              Title
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
              Platform
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
              Status
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
              Views
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
              Link
            </th>
          </tr>
        </thead>
        <tbody>
          {postedVideos.length > 0 ? (
            postedVideos.map((video) => (
              <tr
                key={video.id}
                className="border-b border-border hover:bg-card/50 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-card-foreground">
                  {video.postedAt && format(video.postedAt, 'MMM dd, yyyy')}
                </td>
                <td className="py-3 px-4 text-sm text-card-foreground line-clamp-1">
                  {video.title}
                </td>
                <td className="py-3 px-4 text-sm">
                  {video.platform && <PlatformIcon platform={video.platform} />}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={video.status} />
                </td>
                <td className="py-3 px-4 text-sm text-card-foreground">
                  {video.views?.toLocaleString() || '—'}
                </td>
                <td className="py-3 px-4">
                  {video.url && (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 flex items-center gap-1"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="py-8 text-center text-muted-foreground">
                No posted videos in this period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
