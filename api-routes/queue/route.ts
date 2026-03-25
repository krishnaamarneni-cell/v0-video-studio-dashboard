// app/api/queue/route.ts
// Queue management endpoint

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch queue items
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

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

    return NextResponse.json(data)
  } catch (error) {
    console.error('Queue fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue' },
      { status: 500 }
    )
  }
}

// POST - Add new URL to queue
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, platforms = ['youtube'] } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Determine source type from URL
    let sourceType = 'youtube'
    if (url.includes('c-span.org')) sourceType = 'cspan'
    else if (url.includes('whitehouse.gov')) sourceType = 'whitehouse'
    else if (url.includes('treasury.gov')) sourceType = 'treasury'
    else if (url.includes('federalreserve.gov')) sourceType = 'fed'

    // Insert into queue
    const { data, error } = await supabase
      .from('video_queue')
      .insert({
        source_url: url,
        source_type: sourceType,
        platforms: platforms,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_log').insert({
      action: 'video_queued',
      description: `New video queued from ${sourceType}`,
      status: 'Pending',
      video_id: data.id
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Queue add error:', error)
    return NextResponse.json(
      { error: 'Failed to add to queue' },
      { status: 500 }
    )
  }
}
