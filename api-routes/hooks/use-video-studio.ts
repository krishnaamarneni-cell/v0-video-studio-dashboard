// hooks/use-video-studio.ts
// React hooks for Video Studio data fetching

import { useState, useEffect, useCallback } from 'react'

// Types
export interface Video {
  id: string
  source_url: string
  source_type: string
  source_title: string | null
  status: 'pending' | 'processing' | 'ready' | 'approved' | 'posted' | 'skipped' | 'failed'
  title: string | null
  description: string | null
  duration_seconds: number | null
  video_type: 'short' | 'long' | null
  ai_title: string | null
  ai_description: string | null
  platforms: string[]
  posted_platforms: string[]
  created_at: string
  error_message: string | null
}

export interface Activity {
  id: string
  action: string
  description: string
  status: string | null
  created_at: string
}

export interface Settings {
  id: string
  auto_post_enabled: boolean
  max_posts_per_day: number
  add_logo_to_videos: boolean
  youtube_connected: boolean
  twitter_connected: boolean
  instagram_connected: boolean
  linkedin_connected: boolean
}

export interface Stats {
  pending_count: number
  approved_count: number
  ready_count: number
  posted_today: number
  total_posted: number
}

// Hook for dashboard stats
export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  return { stats, loading, error, refresh: fetchStats }
}

// Hook for queue items
export function useQueue(statusFilter?: string) {
  const [items, setItems] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQueue = useCallback(async () => {
    try {
      const url = statusFilter && statusFilter !== 'all' 
        ? `/api/queue?status=${statusFilter}`
        : '/api/queue'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch queue')
      const data = await res.json()
      setItems(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const approve = async (id: string) => {
    const res = await fetch(`/api/queue/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' })
    })
    if (res.ok) fetchQueue()
  }

  const skip = async (id: string) => {
    const res = await fetch(`/api/queue/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'skip' })
    })
    if (res.ok) fetchQueue()
  }

  const post = async (id: string) => {
    const res = await fetch(`/api/queue/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'post' })
    })
    if (res.ok) fetchQueue()
  }

  const remove = async (id: string) => {
    const res = await fetch(`/api/queue/${id}`, {
      method: 'DELETE'
    })
    if (res.ok) fetchQueue()
  }

  return { items, loading, error, refresh: fetchQueue, approve, skip, post, remove }
}

// Hook for activity log
export function useActivity(limit = 10) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`/api/activity?limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch activity')
      const data = await res.json()
      setActivities(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchActivity()
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [fetchActivity])

  return { activities, loading, error, refresh: fetchActivity }
}

// Hook for settings
export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      setSettings(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSettings = async (updates: Partial<Settings>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!res.ok) throw new Error('Failed to update settings')
      const data = await res.json()
      setSettings(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return { settings, loading, error, saving, refresh: fetchSettings, update: updateSettings }
}

// Hook for processing a new URL
export function useProcessVideo() {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const process = async (url: string, platforms: string[] = ['youtube']) => {
    setProcessing(true)
    setError(null)
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platforms })
      })
      if (!res.ok) throw new Error('Failed to add to queue')
      return await res.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setProcessing(false)
    }
  }

  return { process, processing, error }
}

// Hook for posting history
export function useHistory(days = 7) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/history?days=${days}`)
      if (!res.ok) throw new Error('Failed to fetch history')
      const data = await res.json()
      setHistory(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return { history, loading, error, refresh: fetchHistory }
}
