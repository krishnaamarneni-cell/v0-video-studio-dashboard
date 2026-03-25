import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    console.log('[v0] Fetching stats from Supabase')

    // Get pending videos count
    const { count: pendingCount } = await supabase
      .from('video_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get approved videos count
    const { count: approvedCount } = await supabase
      .from('video_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    // Get today's posted count
    const today = new Date().toISOString().split('T')[0]
    const { count: postedTodayCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'posted')
      .gte('created_at', `${today}T00:00:00`)

    // Get total posted count
    const { count: totalPostedCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'posted')

    const stats = {
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      postedToday: postedTodayCount || 0,
      totalPosted: totalPostedCount || 0,
    }

    console.log('[v0] Stats calculated:', stats)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[v0] Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
