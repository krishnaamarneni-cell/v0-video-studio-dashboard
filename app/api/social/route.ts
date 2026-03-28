// app/api/social/route.ts
// API routes for social media posts

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch social posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    let query = supabase
      .from('social_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ posts: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new social post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const postData = {
      content_type: body.contentType || 'text',
      text_content: body.textContent,
      text_source: body.textSource || 'manual',
      ai_text_prompt: body.aiTextPrompt,
      media_url: body.mediaUrl,
      media_type: body.mediaType,
      media_source: body.mediaSource,
      video_url: body.videoUrl,
      ai_image_prompt: body.aiImagePrompt,
      template_type: body.templateType || 'professional',
      include_branding: body.includeBranding !== false,
      platforms: body.platforms || ['twitter'],
      scheduled_for: body.scheduledFor,
      hashtags: body.hashtags,
      auto_hashtags: body.autoHashtags !== false,
      status: body.scheduledFor ? 'scheduled' : (body.postNow ? 'pending_approval' : 'draft'),
      approval_required: !body.postNow
    }
    
    const { data, error } = await supabase
      .from('social_posts')
      .insert(postData)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ post: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update a social post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('social_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ post: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a social post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
