// app/api/queue/[id]/route.ts
// Fixed version - handles approving, skipping, and deleting videos

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Queue item GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

// PATCH - Update queue item (approve, skip, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, ...updateData } = body;
    
    // Handle action-based updates
    let updates: Record<string, any> = {};
    
    if (action === 'approve') {
      updates = {
        status: 'approved',
        approved_at: new Date().toISOString()
      };
    } else if (action === 'skip') {
      updates = {
        status: 'skipped'
      };
    } else if (action === 'retry') {
      updates = {
        status: 'pending',
        error_message: null
      };
    } else {
      // Direct field updates
      updates = updateData;
    }
    
    const { data, error } = await supabase
      .from('video_queue')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating queue item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Log the activity
    const actionText = action || 'updated';
    await supabase.from('activity_log').insert({
      action: `video_${actionText}`,
      description: `Video ${actionText}: ${data?.title || data?.source_url || params.id}`,
      status: 'success'
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Queue item PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE - Remove queue item
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('video_queue')
      .delete()
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error deleting queue item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Log the activity
    await supabase.from('activity_log').insert({
      action: 'video_deleted',
      description: `Deleted video: ${data?.title || data?.source_url || params.id}`,
      status: 'success'
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Queue item DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
