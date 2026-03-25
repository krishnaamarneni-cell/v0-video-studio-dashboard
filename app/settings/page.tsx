'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';

interface Settings {
  autoPost: boolean;
  maxPostsPerDay: number;
  connectedAccounts: {
    youtube?: { connected: boolean; username?: string };
    twitter?: { connected: boolean; username?: string };
    instagram?: { connected: boolean; username?: string };
    linkedin?: { connected: boolean; username?: string };
  };
}

const platforms = ['youtube', 'twitter', 'instagram', 'linkedin'];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        alert('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!settings) {
    return <div className="text-center py-12">Failed to load settings</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your video studio preferences</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4">Posting Configuration</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm">Auto-post enabled</label>
            <input
              type="checkbox"
              checked={settings.autoPost}
              onChange={(e) =>
                setSettings({ ...settings, autoPost: e.target.checked })
              }
              className="w-5 h-5 rounded"
            />
          </div>

          <div>
            <label className="text-sm block mb-2">Max posts per day</label>
            <input
              type="number"
              value={settings.maxPostsPerDay}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxPostsPerDay: parseInt(e.target.value) || 1,
                })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>

        <div className="space-y-4">
          {platforms.map((platform) => {
            const account = settings.connectedAccounts[platform as keyof typeof settings.connectedAccounts];
            return (
              <div key={platform} className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{platform}</p>
                  {account?.connected && account?.username && (
                    <p className="text-sm text-gray-400">@{account.username}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  account?.connected
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {account?.connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
      >
        {saving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
