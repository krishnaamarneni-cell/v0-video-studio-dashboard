// app/queue/page.tsx
// Queue page with filters and working approve/skip buttons

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Check, 
  X, 
  Loader2, 
  ExternalLink, 
  Clock, 
  RotateCcw,
  Trash2,
  Youtube,
  RefreshCw,
  Play
} from 'lucide-react';

interface VideoItem {
  id: string;
  source_url: string;
  title?: string;
  status: string;
  created_at: string;
  approved_at?: string;
  posted_at?: string;
  youtube_video_id?: string;
  error_message?: string;
}

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'ready', label: 'Ready' },
  { value: 'approved', label: 'Approved' },
  { value: 'posted', label: 'Posted' },
  { value: 'failed', label: 'Failed' },
  { value: 'skipped', label: 'Skipped' }
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ready: 'bg-green-500/20 text-green-400 border-green-500/30',
  approved: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  posted: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  skipped: 'bg-gray-500/20 text-gray-500 border-gray-500/30'
};

function VideoCard({ video, onUpdate }: { video: VideoItem; onUpdate: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: 'approve' | 'skip' | 'retry' | 'delete') => {
    setLoading(action);
    
    try {
      if (action === 'delete') {
        const response = await fetch(`/api/queue?id=${video.id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete');
      } else {
        // Map action to status
        let newStatus = action;
        if (action === 'retry') newStatus = 'pending' as any;
        
        const response = await fetch('/api/queue', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: video.id,
            status: newStatus === 'approve' ? 'approved' : newStatus,
            ...(action === 'approve' && { approved_at: new Date().toISOString() })
          })
        });
        
        if (!response.ok) throw new Error(`Failed to ${action}`);
      }
      
      onUpdate();
    } catch (error) {
      console.error(`Error ${action}:`, error);
      alert(`Failed to ${action} video`);
    } finally {
      setLoading(null);
    }
  };

  const displayTitle = video.title || 'Processing...';
  const statusClass = statusColors[video.status] || statusColors.pending;

  return (
    <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-850 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Video info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs rounded border ${statusClass}`}>
              {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
            </span>
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
            className="text-xs text-blue-400 hover:underline flex items-center gap-1 truncate"
          >
            <Youtube className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{video.source_url}</span>
          </a>
          
          {video.status === 'failed' && video.error_message && (
            <p className="text-xs text-red-400 mt-2">
              Error: {video.error_message}
            </p>
          )}
          
          {video.status === 'posted' && video.youtube_video_id && (
            <a 
              href={`https://youtube.com/watch?v=${video.youtube_video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-400 hover:underline flex items-center gap-1 mt-2"
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
              <button
                onClick={() => handleAction('approve')}
                disabled={loading !== null}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                {loading === 'approve' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Approve
                  </>
                )}
              </button>
              <button
                onClick={() => handleAction('skip')}
                disabled={loading !== null}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                {loading === 'skip' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    Skip
                  </>
                )}
              </button>
            </>
          )}
          
          {/* Pending status */}
          {video.status === 'pending' && (
            <div className="flex items-center text-yellow-400 text-sm">
              <Clock className="h-4 w-4 mr-1 animate-pulse" />
              Waiting...
            </div>
          )}
          
          {/* Processing status */}
          {video.status === 'processing' && (
            <div className="flex items-center text-blue-400 text-sm">
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Processing...
            </div>
          )}
          
          {/* Approved status */}
          {video.status === 'approved' && (
            <div className="flex items-center text-purple-400 text-sm">
              <Clock className="h-4 w-4 mr-1 animate-pulse" />
              Posting...
            </div>
          )}
          
          {/* Failed status */}
          {video.status === 'failed' && (
            <button
              onClick={() => handleAction('retry')}
              disabled={loading !== null}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              {loading === 'retry' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </>
              )}
            </button>
          )}
          
          {/* Delete button */}
          {!['processing', 'approved'].includes(video.status) && (
            <button
              onClick={() => handleAction('delete')}
              disabled={loading !== null}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded-lg transition-colors"
            >
              {loading === 'delete' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QueuePage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [url, setUrl] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      const queryParam = filter === 'all' ? '' : `?status=${filter}`;
      const response = await fetch(`/api/queue${queryParam}`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    const interval = setInterval(fetchVideos, 10000);
    return () => clearInterval(interval);
  }, [fetchVideos]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const handleAddVideo = async () => {
    if (!url.trim()) return;
    
    setAddingVideo(true);
    try {
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: url.trim(),
          source: 'youtube',
          platform: 'youtube'
        })
      });
      
      if (response.ok) {
        setUrl('');
        fetchVideos();
      }
    } catch (error) {
      console.error('Failed to add video:', error);
    } finally {
      setAddingVideo(false);
    }
  };

  const statusCounts = videos.reduce((acc, video) => {
    acc[video.status] = (acc[video.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Video Queue</h1>
          <p className="text-gray-400 mt-1">Manage your video processing queue</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      {/* Add Video */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="Paste YouTube URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddVideo();
            }}
          />
          <button
            onClick={handleAddVideo}
            disabled={addingVideo || !url.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
          >
            {addingVideo ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5" />
                Add Video
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((status) => {
          const count = status.value === 'all' 
            ? videos.length 
            : (statusCounts[status.value] || 0);
          
          return (
            <button
              key={status.value}
              onClick={() => setFilter(status.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {status.label}
              {count > 0 && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && videos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No videos in queue</p>
          <p className="text-sm">Add a YouTube URL above to get started</p>
        </div>
      )}

      {/* Video List */}
      {!loading && videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((video) => (
            <VideoCard 
              key={video.id} 
              video={video} 
              onUpdate={fetchVideos}
            />
          ))}
        </div>
      )}

      {/* Status Flow Info */}
      <div className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-400">
        <p className="font-medium mb-2">Status Flow:</p>
        <p>
          <span className="text-yellow-400">Pending</span> → 
          <span className="text-blue-400 mx-1">Processing</span> → 
          <span className="text-green-400 mx-1">Ready</span> → 
          <span className="text-purple-400 mx-1">Approved</span> → 
          <span className="text-gray-400 mx-1">Posted</span>
        </p>
        <p className="mt-2 text-xs">
          Videos in "Ready" status need your approval. Auto-refreshes every 10 seconds.
        </p>
      </div>
    </div>
  );
}
