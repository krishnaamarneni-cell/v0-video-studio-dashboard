// app/api/stats/route.ts
// Dashboard statistics endpoint

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get stats from the view
    const { data: stats, error } = await supabase
      .from('dashboard_stats')
      .select('*')
      .single()

    if (error) {
      // If view doesn't work, calculate manually
      const [pending, approved, ready, postedToday, totalPosted] = await Promise.all([
        supabase.from('video_queue').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('video_queue').select('id', { count: 'exact' }).eq('status', 'approved'),
        supabase.from('video_queue').select('id', { count: 'exact' }).eq('status', 'ready'),
        supabase.from('video_queue').select('id', { count: 'exact' }).eq('status', 'posted').gte('posted_at', new Date().toISOString().split('T')[0]),
        supabase.from('video_queue').select('id', { count: 'exact' }).eq('status', 'posted'),
      ])

      return NextResponse.json({
        pending_count: pending.count || 0,
        approved_count: approved.count || 0,
        ready_count: ready.count || 0,
        posted_today: postedToday.count || 0,
        total_posted: totalPosted.count || 0,
      })
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
