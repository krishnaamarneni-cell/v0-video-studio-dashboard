'use client';

import { useState, useEffect } from 'react';

interface MonitoredAccount {
  id: string;
  username: string;
  enabled: boolean;
  last_checked_at: string | null;
  last_reel_id: string | null;
  reels_found: number;
  reels_posted: number;
  auto_post_instagram: boolean;
  auto_post_youtube: boolean;
  created_at: string;
}

export default function AutoFollowTab() {
  const [accounts, setAccounts] = useState<MonitoredAccount[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/social/monitor');
      const data = await response.json();
      if (data.accounts) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newUsername.trim()) {
      setMessage({ type: 'error', text: 'Please enter a username' });
      return;
    }

    const username = newUsername.replace('@', '').trim();

    setIsAdding(true);
    setMessage(null);

    try {
      const response = await fetch('/api/social/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: `Added @${username} to monitored accounts!` });
        setNewUsername('');
        fetchAccounts();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add account' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleEnabled = async (account: MonitoredAccount) => {
    try {
      await fetch('/api/social/monitor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: account.id,
          enabled: !account.enabled,
        }),
      });
      fetchAccounts();
    } catch (error) {
      console.error('Failed to toggle account:', error);
    }
  };

  const handleTogglePlatform = async (account: MonitoredAccount, platform: 'instagram' | 'youtube') => {
    const field = platform === 'instagram' ? 'auto_post_instagram' : 'auto_post_youtube';
    const currentValue = account[field];

    try {
      await fetch('/api/social/monitor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: account.id,
          [field]: !currentValue,
        }),
      });
      fetchAccounts();
    } catch (error) {
      console.error('Failed to toggle platform:', error);
    }
  };

  const handleRemoveAccount = async (account: MonitoredAccount) => {
    if (!confirm(`Remove @${account.username} from monitoring?`)) return;

    try {
      await fetch(`/api/social/monitor?id=${account.id}`, {
        method: 'DELETE',
      });
      setMessage({ type: 'success', text: `Removed @${account.username}` });
      fetchAccounts();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove account' });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">🔄 Auto-Follow Accounts</h2>
        <p className="text-gray-400 text-sm">
          Monitor Instagram accounts for new reels. When they post, we automatically repost to your Instagram & YouTube!
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success'
            ? 'bg-green-900/50 border border-green-700'
            : 'bg-red-900/50 border border-red-700'
          }`}>
          {message.text}
        </div>
      )}

      {/* Add Account */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">➕ Add Account to Monitor</h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.replace('@', ''))}
              placeholder="username"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
            />
          </div>
          <button
            onClick={handleAddAccount}
            disabled={isAdding || !newUsername.trim()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            {isAdding ? '⏳ Adding...' : '+ Add Account'}
          </button>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">📋 Monitored Accounts</h3>

        {isLoading ? (
          <div className="text-center py-8 text-gray-400">
            ⏳ Loading accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-4">📭</p>
            <p>No accounts being monitored yet.</p>
            <p className="text-sm mt-2">Add an Instagram username above to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`border rounded-lg p-4 transition-colors ${account.enabled
                    ? 'border-gray-700 bg-gray-700/30'
                    : 'border-gray-800 bg-gray-800/30 opacity-60'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Username & Status */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-medium">@{account.username}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${account.enabled
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-gray-700 text-gray-400'
                        }`}>
                        {account.enabled ? '● Active' : '○ Paused'}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                      <span>🕐 Checked: {formatDate(account.last_checked_at)}</span>
                      <span>📊 Found: {account.reels_found || 0}</span>
                      <span>✅ Posted: {account.reels_posted || 0}</span>
                    </div>

                    {/* Platform Toggles */}
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={account.auto_post_instagram}
                          onChange={() => handleTogglePlatform(account, 'instagram')}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-pink-500"
                        />
                        <span className="text-sm">📸 Instagram</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={account.auto_post_youtube}
                          onChange={() => handleTogglePlatform(account, 'youtube')}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-red-500"
                        />
                        <span className="text-sm">📺 YouTube</span>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleToggleEnabled(account)}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${account.enabled
                          ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                          : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        }`}
                    >
                      {account.enabled ? '⏸️ Pause' : '▶️ Resume'}
                    </button>
                    <button
                      onClick={() => handleRemoveAccount(account)}
                      className="px-3 py-1.5 rounded text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-3">📋 How It Works</h3>
        <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
          <li>Add Instagram accounts to monitor above</li>
          <li>Your local Python script checks for new reels every hour</li>
          <li>When a new reel is detected, it automatically:</li>
          <ul className="ml-6 mt-1 space-y-1 list-disc">
            <li>Downloads the video</li>
            <li>Generates an AI caption with "Follow @wealthclaude"</li>
            <li>Posts to Instagram & YouTube</li>
            <li>Deletes from cloud storage after 24 hours</li>
          </ul>
        </ol>

        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500">
            <strong>Run the monitor:</strong>{' '}
            <code className="bg-gray-700 px-1 rounded">python account_monitor.py service</code>
          </p>
        </div>
      </div>
    </div>
  );
}
