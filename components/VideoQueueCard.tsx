// components/VideoQueueCard.tsx
// A video card with working Approve/Skip buttons

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Loader2, 
  ExternalLink, 
  Clock, 
  RotateCcw,
  Trash2,
  Youtube
} from 'lucide-react';

interface VideoQueueItem {
  id: string;
  source_url: string;
  title?: string;
  status: 'pending' | 'processing' | 'ready' | 'approved' | 'posted' | 'failed' | 'skipped';
  created_at: string;
  approved_at?: string;
  posted_at?: string;
  youtube_video_id?: string;
  error_message?: string;
  ai_title?: string[];
  ai_description?: string;
}

interface VideoQueueCardProps {
  video: VideoQueueItem;
  onUpdate?: () => void; // Called after any action to refresh the list
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
  ready: { color: 'bg-green-100 text-green-800', label: 'Ready' },
  approved: { color: 'bg-purple-100 text-purple-800', label: 'Approved' },
  posted: { color: 'bg-gray-100 text-gray-800', label: 'Posted' },
  failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
  skipped: { color: 'bg-gray-100 text-gray-500', label: 'Skipped' }
};

export function VideoQueueCard({ video, onUpdate }: VideoQueueCardProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: 'approve' | 'skip' | 'retry' | 'delete') => {
    setLoading(action);
    
    try {
      if (action === 'delete') {
        const response = await fetch(`/api/queue/${video.id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete');
        }
      } else {
        const response = await fetch(`/api/queue/${video.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to ${action}`);
        }
      }
      
      // Refresh the list
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
      alert(`Failed to ${action} video`);
    } finally {
      setLoading(null);
    }
  };

  const displayTitle = video.title || video.ai_title?.[0] || 'Untitled Video';
  const statusInfo = statusConfig[video.status] || statusConfig.pending;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Video info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              <span className="text-xs text-gray-500">
                {new Date(video.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <h3 className="font-medium text-sm mb-1 truncate" title={displayTitle}>
              {displayTitle}
            </h3>
            
            <a 
              href={video.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
            >
              <Youtube className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{video.source_url}</span>
            </a>
            
            {/* Error message for failed videos */}
            {video.status === 'failed' && video.error_message && (
              <p className="text-xs text-red-600 mt-2">
                Error: {video.error_message}
              </p>
            )}
            
            {/* YouTube link for posted videos */}
            {video.status === 'posted' && video.youtube_video_id && (
              <a 
                href={`https://youtube.com/watch?v=${video.youtube_video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                View on YouTube
              </a>
            )}
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Ready status - Show Approve and Skip */}
            {video.status === 'ready' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleAction('approve')}
                  disabled={loading !== null}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading === 'approve' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('skip')}
                  disabled={loading !== null}
                >
                  {loading === 'skip' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Skip
                    </>
                  )}
                </Button>
              </>
            )}
            
            {/* Pending status - Show waiting indicator */}
            {video.status === 'pending' && (
              <div className="flex items-center text-yellow-600 text-sm">
                <Clock className="h-4 w-4 mr-1 animate-pulse" />
                Waiting...
              </div>
            )}
            
            {/* Processing status - Show processing indicator */}
            {video.status === 'processing' && (
              <div className="flex items-center text-blue-600 text-sm">
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Processing...
              </div>
            )}
            
            {/* Approved status - Show waiting to post */}
            {video.status === 'approved' && (
              <div className="flex items-center text-purple-600 text-sm">
                <Clock className="h-4 w-4 mr-1 animate-pulse" />
                Posting...
              </div>
            )}
            
            {/* Failed status - Show retry button */}
            {video.status === 'failed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('retry')}
                disabled={loading !== null}
              >
                {loading === 'retry' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Retry
                  </>
                )}
              </Button>
            )}
            
            {/* Delete button - Always show for non-processing videos */}
            {video.status !== 'processing' && video.status !== 'approved' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAction('delete')}
                disabled={loading !== null}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {loading === 'delete' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
