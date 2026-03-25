// lib/supabase.ts
// Supabase client for server-side use

import { createClient } from '@supabase/supabase-js'

// Types for your database
export interface Video {
  id: string
  source_url: string
  source_type: string
  source_title: string | null
  status: 'pending' | 'processing' | 'ready' | 'approved' | 'posted' | 'skipped' | 'failed'
  title: string | null
  description: string | null
  tags: string[] | null
  thumbnail_url: string | null
  duration_seconds: number | null
  video_type: 'short' | 'long' | null
  processed_video_url: string | null
  ai_title: string | null
  ai_description: string | null
  ai_tags: string[] | null
  ai_hook: string | null
  platforms: string[]
  posted_platforms: string[]
  youtube_video_id: string | null
  twitter_post_id: string | null
  instagram_post_id: string | null
  linkedin_post_id: string | null
  created_at: string
  updated_at: string
  processed_at: string | null
  approved_at: string | null
  posted_at: string | null
  error_message: string | null
  retry_count: number
}

export interface Activity {
  id: string
  action: string
  description: string
  status: string | null
  video_id: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface Settings {
  id: string
  auto_post_enabled: boolean
  max_posts_per_day: number
  add_logo_to_videos: boolean
  logo_url: string | null
  youtube_connected: boolean
  youtube_channel_id: string | null
  youtube_channel_name: string | null
  twitter_connected: boolean
  twitter_username: string | null
  instagram_connected: boolean
  instagram_username: string | null
  linkedin_connected: boolean
  linkedin_profile_id: string | null
  youtube_credentials_set: boolean
  twitter_credentials_set: boolean
  instagram_credentials_set: boolean
  linkedin_credentials_set: boolean
  created_at: string
  updated_at: string
}

export interface PostingHistory {
  id: string
  video_id: string | null
  platform: string
  platform_post_id: string | null
  platform_url: string | null
  title: string | null
  views: number
  likes: number
  comments: number
  shares: number
  status: string
  error_message: string | null
  posted_at: string
}

export interface DashboardStats {
  pending_count: number
  approved_count: number
  ready_count: number
  posted_today: number
  total_posted: number
  processing_count: number
  failed_count: number
}

// Create Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper functions
export async function getStats(): Promise<DashboardStats> {
  const [pending, approved, ready, processing, failed, postedToday, totalPosted] = await Promise.all([
    supabase.from('video_queue').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('video_queue').select('id', { count: 'exact' }).eq('status', 'approved'),
    supabase.from('video_queue').select('id', { count: 'exact' }).eq('status', 'ready'),
    supabase.from('video_queue').select('id', { count: 'exact' }).eq('status', 'processing'),
    supabase.from('video_queue').select('id', { count: 'exact' }).eq('status', 'failed'),
    supabase.from('video_queue').select('id', { count: 'exact' }).eq('status', 'posted').gte('posted_at', new Date().toISOString().split('T')[0]),
    supabase.from('video_queue').select('id', { count: 'exact' }).eq('status', 'posted'),
  ])

  return {
    pending_count: pending.count || 0,
    approved_count: approved.count || 0,
    ready_count: ready.count || 0,
    processing_count: processing.count || 0,
    failed_count: failed.count || 0,
    posted_today: postedToday.count || 0,
    total_posted: totalPosted.count || 0,
  }
}

export async function getQueue(status?: string, limit = 50): Promise<Video[]> {
  let query = supabase
    .from('video_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getActivity(limit = 10): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getSettings(): Promise<Settings | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single()

  if (error) return null
  return data
}
