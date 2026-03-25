// app/api/queue/[id]/route.ts
// Individual queue item actions (approve, skip, post, delete)

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch single queue item
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('video_queue')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Queue item fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue item' },
      { status: 500 }
    )
  }
}

// PATCH - Update queue item (approve, skip, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action, ...updates } = body

    let updateData: Record<string, any> = { ...updates }
    let activityAction = ''
    let activityDescription = ''
    let activityStatus = ''

    // Handle specific actions
    switch (action) {
      case 'approve':
        updateData.status = 'approved'
        updateData.approved_at = new Date().toISOString()
        activityAction = 'video_approved'
        activityDescription = 'Video approved and ready to post'
        activityStatus = 'Approved'
        break

      case 'skip':
        updateData.status = 'skipped'
        activityAction = 'video_skipped'
        activityDescription = 'Video skipped'
        activityStatus = 'Skipped'
        break

      case 'post':
        // Mark as ready to post - the Python processor will pick it up
        updateData.status = 'approved'
        updateData.approved_at = new Date().toISOString()
        activityAction = 'video_queued_post'
        activityDescription = 'Video queued for immediate posting'
        activityStatus = 'Posting'
        break

      case 'retry':
        updateData.status = 'pending'
        updateData.error_message = null
        updateData.retry_count = (updates.retry_count || 0) + 1
        activityAction = 'video_retry'
        activityDescription = 'Video queued for retry'
        activityStatus = 'Pending'
        break

      default:
        // Just apply the updates directly
        break
    }

    const { data, error } = await supabase
      .from('video_queue')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // Log activity if action was taken
    if (activityAction) {
      await supabase.from('activity_log').insert({
        action: activityAction,
        description: activityDescription,
        status: activityStatus,
        video_id: params.id
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Queue item update error:', error)
    return NextResponse.json(
      { error: 'Failed to update queue item' },
      { status: 500 }
    )
  }
}

// DELETE - Remove from queue
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('video_queue')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Queue item delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete queue item' },
      { status: 500 }
    )
  }
}
