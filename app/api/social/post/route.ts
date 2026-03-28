// app/api/social/post/route.ts
// API route to post to Instagram/LinkedIn via Make.com
// Supports both image posts and reels/videos

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || 'https://hook.us2.make.com/0kaubvw2hfot76jkqa5nstppp5q7q953';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      platform,
      text,
      image_url,
      video_url,
      content_type = 'image', // 'image' or 'reel'
      post_id
    } = body;

    // Validate required fields
    if (!platform || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, text' },
        { status: 400 }
      );
    }

    // Validate platform
    if (!['instagram', 'linkedin', 'both'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be: instagram, linkedin, or both' },
        { status: 400 }
      );
    }

    // Determine platforms to post to
    const platforms = platform === 'both'
      ? ['instagram', 'linkedin']
      : [platform];

    const results: Record<string, any> = {};

    // Post to each platform via Make.com
    for (const p of platforms) {
      const payload: Record<string, any> = {
        platform: p,
        text: text,
        content_type: content_type,
        timestamp: new Date().toISOString()
      };

      // Add media based on content type
      if (content_type === 'reel' && video_url) {
        payload.video_url = video_url;
        payload.image_url = image_url || null; // Thumbnail
      } else if (image_url) {
        payload.image_url = image_url;
      }

      try {
        const response = await fetch(MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        results[p] = {
          success: response.ok || responseText === 'Accepted',
          status: response.status,
          response: responseText,
          content_type: content_type
        };
      } catch (error: any) {
        results[p] = {
          success: false,
          error: error.message
        };
      }
    }

    // Update post status in Supabase if post_id provided
    if (post_id) {
      const allSuccess = Object.values(results).every((r: any) => r.success);

      await supabase
        .from('social_posts')
        .update({
          status: allSuccess ? 'posted' : 'failed',
          posted_at: allSuccess ? new Date().toISOString() : null,
          post_results: results
        })
        .eq('id', post_id);
    }

    // Log the post
    try {
      await supabase
        .from('social_posts')
        .insert({
          text_content: text,
          media_url: video_url || image_url,
          platforms: platforms,
          content_type: content_type,
          status: Object.values(results).every((r: any) => r.success) ? 'posted' : 'failed',
          posted_at: new Date().toISOString(),
          post_results: results
        });
    } catch (e) {
      // Logging is optional, don't fail if it doesn't work
      console.log('Could not log post to Supabase:', e);
    }

    return NextResponse.json({
      success: true,
      results: results
    });

  } catch (error: any) {
    console.error('Error posting to Make.com:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to post' },
      { status: 500 }
    );
  }
}