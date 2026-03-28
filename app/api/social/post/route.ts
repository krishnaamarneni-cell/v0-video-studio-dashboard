// app/api/social/post/route.ts
// API route to post directly to Instagram/LinkedIn via Make.com

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
    const { platform, text, image_url, post_id } = body;

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
      const payload = {
        platform: p,
        text: text,
        image_url: image_url || null,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();

      results[p] = {
        success: response.ok || responseText === 'Accepted',
        status: response.status,
        response: responseText
      };
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
