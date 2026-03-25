// app/queue/page.tsx
// Complete Queue page with filters and working approve/skip buttons

'use client';

import { useState, useEffect, useCallback } from 'react';
import { VideoQueueCard } from '@/components/VideoQueueCard';
import { AddVideoForm } from '@/components/AddVideoForm';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface VideoQueueItem {
  id: string;
  source_url: string;
  title?: string;
  status: string;
  created_at: string;
  approved_at?: string;
  posted_at?: string;
  youtube_video_id?: string;
  error_message?: string;
  ai_title?: string[];
  ai_description?: string;
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

export default function QueuePage() {
  const [videos, setVideos] = useState<VideoQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      const url = filter === 'all' 
        ? '/api/queue' 
        : `/api/queue?status=${filter}`;
      
      const response = await fetch(url);
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

  // Initial load and when filter changes
  useEffect(() => {
    setLoading(true);
    fetchVideos();
  }, [fetchVideos]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchVideos, 10000);
    return () => clearInterval(interval);
  }, [fetchVideos]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const handleVideoUpdate = () => {
    fetchVideos();
  };

  // Count by status
  const statusCounts = videos.reduce((acc, video) => {
    acc[video.status] = (acc[video.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Video Queue</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Add Video Form */}
      <div className="mb-6">
        <AddVideoForm onSuccess={handleVideoUpdate} />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((status) => {
          const count = status.value === 'all' 
            ? videos.length 
            : (statusCounts[status.value] || 0);
          
          return (
            <Button
              key={status.value}
              variant={filter === status.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status.value)}
            >
              {status.label}
              {count > 0 && (
                <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Loading State */}
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
        <div className="space-y-4">
          {videos.map((video) => (
            <VideoQueueCard 
              key={video.id} 
              video={video as any} 
              onUpdate={handleVideoUpdate}
            />
          ))}
        </div>
      )}

      {/* Status Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p className="font-medium mb-2">Status Flow:</p>
        <p>
          <span className="text-yellow-600">Pending</span> → 
          <span className="text-blue-600 mx-1">Processing</span> → 
          <span className="text-green-600 mx-1">Ready</span> → 
          <span className="text-purple-600 mx-1">Approved</span> → 
          <span className="text-gray-600 mx-1">Posted</span>
        </p>
        <p className="mt-2 text-xs">
          Videos in "Ready" status need your approval before posting to YouTube.
          Auto-refreshes every 10 seconds.
        </p>
      </div>
    </div>
  );
}
