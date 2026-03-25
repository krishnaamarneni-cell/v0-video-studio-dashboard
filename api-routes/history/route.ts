// app/api/history/route.ts
// Posting history endpoint for History page

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch posting history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const limit = parseInt(searchParams.get('limit') || '50')
    const platform = searchParams.get('platform')

    // Calculate date filter
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    let query = supabase
      .from('posting_history')
      .select('*')
      .gte('posted_at', fromDate.toISOString())
      .order('posted_at', { ascending: false })
      .limit(limit)

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}

// POST - Add history entry (called by Python processor)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { video_id, platform, platform_post_id, platform_url, title, status } = body

    const { data, error } = await supabase
      .from('posting_history')
      .insert({
        video_id,
        platform,
        platform_post_id,
        platform_url,
        title,
        status: status || 'posted'
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_log').insert({
      action: 'video_posted',
      description: `Video posted to ${platform}`,
      status: 'Posted',
      video_id,
      metadata: { platform, platform_url }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('History add error:', error)
    return NextResponse.json(
      { error: 'Failed to add history' },
      { status: 500 }
    )
  }
}
