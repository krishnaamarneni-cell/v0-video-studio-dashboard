// app/page.tsx
// Dashboard home page with stats, quick actions, and recent activity

'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  Loader2, 
  Check, 
  AlertCircle,
  Clock,
  CheckCircle,
  Upload,
  TrendingUp
} from 'lucide-react';

// Stats Card Component
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: number | string; 
  icon: any; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    yellow: 'border-l-yellow-500',
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
  };

  return (
    <div className={`bg-gray-900 rounded-lg p-6 border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="w-8 h-8 text-gray-600" />
      </div>
    </div>
  );
}

// Quick Actions Component with WORKING Process button
function QuickActions({ onVideoAdded }: { onVideoAdded: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleProcess = async () => {
    if (!url.trim()) {
      setStatus('error');
      setMessage('Please enter a URL');
      return;
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      setStatus('error');
      setMessage('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add video');
      }

      setStatus('success');
      setMessage('Video added to queue!');
      setUrl('');
      onVideoAdded(); // Refresh stats

      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error adding video:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="space-y-4">
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="Paste YouTube URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleProcess();
            }}
          />
          <button
            onClick={handleProcess}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5" />
                Process
              </>
            )}
          </button>
        </div>

        {status !== 'idle' && (
          <div className={`flex items-center gap-2 text-sm ${
            status === 'success' ? 'text-green-400' : 'text-red-400'
          }`}>
            {status === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

// Recent Activity Component
function RecentActivity({ activities }: { activities: any[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      {activities.length === 0 ? (
        <p className="text-gray-500 text-sm">No recent activity</p>
      ) : (
        <ul className="space-y-3">
          {activities.slice(0, 5).map((activity, index) => (
            <li key={activity.id || index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(activity.status)}`} />
                <span className="text-sm text-gray-300 truncate max-w-[200px]">
                  {activity.description || activity.action}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(activity.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Main Dashboard Page
export default function DashboardPage() {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    postedToday: 0,
    totalPosted: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          pending: statsData.pending_count || 0,
          approved: statsData.approved_count || 0,
          postedToday: statsData.posted_today || 0,
          totalPosted: statsData.total_posted || 0
        });
      }

      // Fetch activity
      const activityRes = await fetch('/api/activity');
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivities(Array.isArray(activityData) ? activityData : []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back to your video studio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Pending Videos"
          value={loading ? '-' : stats.pending}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Approved Videos"
          value={loading ? '-' : stats.approved}
          icon={CheckCircle}
          color="blue"
        />
        <StatsCard
          title="Posted Today"
          value={loading ? '-' : stats.postedToday}
          icon={Upload}
          color="green"
        />
        <StatsCard
          title="Total Posted"
          value={loading ? '-' : stats.totalPosted}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Quick Actions and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActions onVideoAdded={fetchData} />
        </div>
        <div>
          <RecentActivity activities={activities} />
        </div>
      </div>
    </div>
  );
}
