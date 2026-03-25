'use client';

import { useState, useEffect } from 'react';
import { Filter, Loader2 } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  source: string;
  status: 'pending' | 'approved' | 'ready' | 'posted';
  created_at: string;
  thumbnail?: string;
  duration?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  approved: 'bg-blue-500',
  ready: 'bg-purple-500',
  posted: 'bg-green-500',
};

export default function QueuePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const url = filter === 'all' ? '/api/queue' : `/api/queue?status=${filter}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setVideos(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching queue:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, [filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Queue</h1>
        <p className="text-gray-400 mt-1">Manage your video queue and posting schedule</p>
      </div>

      <div className="flex gap-2 items-center">
        <Filter className="w-5 h-5 text-gray-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="all">All Videos</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="ready">Ready</option>
          <option value="posted">Posted</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No videos in queue</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors"
            >
              {video.thumbnail && (
                <div className="aspect-video bg-gray-800 overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{video.source}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColors[video.status]}`}>
                    {video.status}
                  </span>
                  {video.duration && <span className="text-sm text-gray-500">{video.duration}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
