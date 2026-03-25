// app/api/queue/route.ts
// Fixed version - handles adding videos to queue and fetching queue

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all queue items
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let query = supabase
      .from('video_queue')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching queue:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Queue GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}

// POST - Add new video to queue
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source_url } = body;
    
    if (!source_url) {
      return NextResponse.json({ error: 'source_url is required' }, { status: 400 });
    }
    
    // Validate it's a YouTube URL
    const isYouTube = source_url.includes('youtube.com') || source_url.includes('youtu.be');
    if (!isYouTube) {
      return NextResponse.json({ error: 'Only YouTube URLs are supported' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('video_queue')
      .insert({
        source_url: source_url,
        source_type: 'youtube',
        platforms: ['youtube'],
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding to queue:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Also log the activity
    await supabase.from('activity_log').insert({
      action: 'video_added',
      description: `Added video to queue: ${source_url}`,
      status: 'success'
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Queue POST error:', error);
    return NextResponse.json({ error: 'Failed to add video' }, { status: 500 });
  }
}
