'use client';

import { useState, useEffect } from 'react';
import { Calendar, Loader2, ExternalLink } from 'lucide-react';

interface HistoryItem {
  id: string;
  title: string;
  platform: string;
  status: 'posted' | 'pending' | 'error';
  views?: number;
  url?: string;
  posted_at: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/activity?filter=${filter}`);
        if (res.ok) {
          const data = await res.json();
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [filter]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-gray-400 mt-1">View your posting history and performance metrics</p>
      </div>

      <div className="flex gap-2 items-center">
        <Calendar className="w-5 h-5 text-gray-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No posting history</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr className="text-left text-sm text-gray-400">
                <th className="pb-3 px-4">Date</th>
                <th className="pb-3 px-4">Title</th>
                <th className="pb-3 px-4">Platform</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Views</th>
                <th className="pb-3 px-4">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-4 text-sm">{formatDate(item.posted_at)}</td>
                  <td className="py-3 px-4 text-sm line-clamp-1">{item.title}</td>
                  <td className="py-3 px-4 text-sm capitalize">{item.platform}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'posted'
                          ? 'bg-green-500 text-white'
                          : item.status === 'pending'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{item.views?.toLocaleString() || '—'}</td>
                  <td className="py-3 px-4">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
