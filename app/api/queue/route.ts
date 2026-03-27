import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Video } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('video_queue')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Queue API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    console.log('[v0] Queue POST received body:', body)

    if (!body.sourceUrl) {
      console.log('[v0] Missing sourceUrl')
      return NextResponse.json(
        { error: 'Source URL is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Creating video with URL:', body.sourceUrl)

    const { data, error } = await supabase
      .from('video_queue')
      .insert([
        {
          source_url: body.sourceUrl,
          source_type: body.source || 'youtube',
          platforms: [body.platform || 'youtube'],
          status: 'pending',
        },
      ])
      .select()

    if (error) {
      console.error('[v0] Supabase insert error:', error)
      throw error
    }

    console.log('[v0] Video created successfully:', data)
    return NextResponse.json(data[0])
  } catch (error) {
    console.error('[v0] Queue POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create video' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updates } = body

    const { data, error } = await supabase
      .from('video_queue')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Queue PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Video ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('video_queue').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Queue DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}
