# Integrating API Routes with Your V0 Dashboard

This guide shows you how to add the API routes to your V0-generated dashboard.

## Step 1: Install Supabase Client

In your v0 project terminal:

```bash
npm install @supabase/supabase-js
```

## Step 2: Add Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Create API Route Files

Create these folders and files in your v0 project:

```
app/
├── api/
│   ├── stats/
│   │   └── route.ts      ← Copy from api-routes/stats/route.ts
│   ├── queue/
│   │   ├── route.ts      ← Copy from api-routes/queue/route.ts
│   │   └── [id]/
│   │       └── route.ts  ← Copy from api-routes/queue/[id]/route.ts
│   ├── activity/
│   │   └── route.ts      ← Copy from api-routes/activity/route.ts
│   ├── settings/
│   │   └── route.ts      ← Copy from api-routes/settings/route.ts
│   └── history/
│       └── route.ts      ← Copy from api-routes/history/route.ts
├── lib/
│   └── supabase.ts       ← Copy from api-routes/lib/supabase.ts
└── hooks/
    └── use-video-studio.ts ← Copy from api-routes/hooks/use-video-studio.ts
```

## Step 4: Update Dashboard Component

Replace the placeholder data in your dashboard with real data fetching.

### Dashboard Page (app/page.tsx)

```tsx
'use client'

import { useStats, useActivity, useProcessVideo } from '@/hooks/use-video-studio'
import { useState } from 'react'

export default function Dashboard() {
  const { stats, loading: statsLoading } = useStats()
  const { activities, loading: activityLoading } = useActivity(5)
  const { process, processing } = useProcessVideo()
  const [url, setUrl] = useState('')

  const handleProcess = async () => {
    if (!url) return
    await process(url)
    setUrl('')
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard 
          title="Pending Videos" 
          value={stats?.pending_count ?? 0} 
          loading={statsLoading}
        />
        <StatsCard 
          title="Approved Videos" 
          value={stats?.approved_count ?? 0}
          loading={statsLoading}
        />
        <StatsCard 
          title="Posted Today" 
          value={stats?.posted_today ?? 0}
          loading={statsLoading}
        />
        <StatsCard 
          title="Total Posted" 
          value={stats?.total_posted ?? 0}
          loading={statsLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2>Quick Actions</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube URL..."
            className="flex-1 p-2 border rounded"
          />
          <button 
            onClick={handleProcess}
            disabled={processing || !url}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {processing ? 'Processing...' : 'Process'}
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2>Recent Activity</h2>
        {activityLoading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {activities.map((activity) => (
              <li key={activity.id} className="flex justify-between py-2">
                <span>{activity.description}</span>
                <span className="text-sm text-gray-500">
                  {new Date(activity.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
```

### Queue Page (app/queue/page.tsx)

```tsx
'use client'

import { useQueue } from '@/hooks/use-video-studio'
import { useState } from 'react'

export default function QueuePage() {
  const [filter, setFilter] = useState('all')
  const { items, loading, approve, skip, post, remove } = useQueue(filter)

  return (
    <div>
      <h1>Queue</h1>
      
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'ready', 'approved', 'posted'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded ${
              filter === status ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Queue Items */}
      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No items in queue</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="p-4 border rounded flex justify-between">
              <div>
                <h3>{item.ai_title || item.source_title || 'Untitled'}</h3>
                <p className="text-sm text-gray-500">
                  {item.source_type} • {item.duration_seconds}s
                </p>
                <span className={`px-2 py-1 text-xs rounded ${
                  item.status === 'posted' ? 'bg-green-100 text-green-800' :
                  item.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  item.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
              </div>
              <div className="flex gap-2">
                {item.status === 'ready' && (
                  <>
                    <button onClick={() => approve(item.id)} className="px-3 py-1 bg-green-500 text-white rounded">
                      Approve
                    </button>
                    <button onClick={() => skip(item.id)} className="px-3 py-1 bg-gray-500 text-white rounded">
                      Skip
                    </button>
                  </>
                )}
                {item.status === 'approved' && (
                  <button onClick={() => post(item.id)} className="px-3 py-1 bg-blue-500 text-white rounded">
                    Post Now
                  </button>
                )}
                <button onClick={() => remove(item.id)} className="px-3 py-1 bg-red-500 text-white rounded">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Settings Page (app/settings/page.tsx)

```tsx
'use client'

import { useSettings } from '@/hooks/use-video-studio'

export default function SettingsPage() {
  const { settings, loading, saving, update } = useSettings()

  if (loading) return <p>Loading...</p>
  if (!settings) return <p>Error loading settings</p>

  return (
    <div>
      <h1>Settings</h1>

      {/* Connected Accounts */}
      <section className="mt-8">
        <h2>Connected Accounts</h2>
        <div className="grid grid-cols-2 gap-4">
          <AccountCard 
            name="YouTube" 
            connected={settings.youtube_connected}
            onConnect={() => {/* OAuth flow */}}
          />
          <AccountCard 
            name="Twitter/X" 
            connected={settings.twitter_connected}
            onConnect={() => {/* OAuth flow */}}
          />
          <AccountCard 
            name="Instagram" 
            connected={settings.instagram_connected}
            onConnect={() => {/* OAuth flow */}}
          />
          <AccountCard 
            name="LinkedIn" 
            connected={settings.linkedin_connected}
            onConnect={() => {/* OAuth flow */}}
          />
        </div>
      </section>

      {/* Posting Settings */}
      <section className="mt-8">
        <h2>Posting Settings</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.auto_post_enabled}
              onChange={(e) => update({ auto_post_enabled: e.target.checked })}
            />
            Auto-post mode (post approved videos automatically)
          </label>

          <div>
            <label>Max posts per day</label>
            <input
              type="number"
              value={settings.max_posts_per_day}
              onChange={(e) => update({ max_posts_per_day: parseInt(e.target.value) })}
              className="ml-2 w-20 p-2 border rounded"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.add_logo_to_videos}
              onChange={(e) => update({ add_logo_to_videos: e.target.checked })}
            />
            Add logo to videos
          </label>
        </div>

        <button 
          disabled={saving}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </section>
    </div>
  )
}

function AccountCard({ name, connected, onConnect }) {
  return (
    <div className="p-4 border rounded flex justify-between items-center">
      <div>
        <h3>{name}</h3>
        <span className={connected ? 'text-green-500' : 'text-gray-500'}>
          {connected ? '✓ Connected' : 'Not connected'}
        </span>
      </div>
      <button 
        onClick={onConnect}
        className={`px-3 py-1 rounded ${
          connected ? 'bg-red-100 text-red-800' : 'bg-blue-500 text-white'
        }`}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  )
}
```

## Step 5: Deploy

1. Push changes to GitHub (if connected) or redeploy manually
2. Test the dashboard at your Vercel URL

## Troubleshooting

### "Failed to fetch" errors
- Check Vercel Environment Variables are set
- Check Supabase URL and key are correct
- Check you ran the schema.sql in Supabase

### Stats show all zeros
- Run the schema.sql in Supabase SQL Editor
- Check the `video_queue` table exists

### Queue not updating
- Check the Python processor is running
- Check Supabase logs for errors
