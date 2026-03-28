// app/api/social/import-reel/route.ts
// API route to import Instagram Reels - downloads video and generates caption

import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; // Optional: for Instagram API service

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, generate_caption = true } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing Instagram URL' }, { status: 400 });
    }

    // Validate Instagram URL
    if (!url.includes('instagram.com')) {
      return NextResponse.json(
        { error: 'Invalid Instagram URL' },
        { status: 400 }
      );
    }

    // Extract the shortcode from the URL
    const shortcodeMatch = url.match(/\/(reel|p|reels)\/([A-Za-z0-9_-]+)/);
    if (!shortcodeMatch) {
      return NextResponse.json(
        { error: 'Could not extract reel ID from URL' },
        { status: 400 }
      );
    }
    const shortcode = shortcodeMatch[2];

    let videoUrl = '';
    let thumbnailUrl = '';
    let caption = '';

    // Method 1: Try using RapidAPI Instagram service (if configured)
    if (RAPIDAPI_KEY) {
      try {
        const apiResponse = await fetch(
          `https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=${encodeURIComponent(url)}`,
          {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
            },
          }
        );

        if (apiResponse.ok) {
          const data = await apiResponse.json();
          videoUrl = data.data?.video_url || '';
          thumbnailUrl = data.data?.thumbnail_url || '';
          caption = data.data?.caption?.text || '';
        }
      } catch (e) {
        console.error('RapidAPI error:', e);
      }
    }

    // Method 2: Try alternative free API (saveig.app style)
    if (!videoUrl) {
      try {
        // Using a public Instagram downloader API
        const response = await fetch('https://api.saveig.app/api/get_info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.video_url) {
            videoUrl = data.video_url;
          }
        }
      } catch (e) {
        console.error('SaveIG API error:', e);
      }
    }

    // Method 3: Direct extraction attempt (might be rate-limited)
    if (!videoUrl) {
      try {
        // Fetch the Instagram page directly
        const pageResponse = await fetch(`https://www.instagram.com/p/${shortcode}/embed/`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (pageResponse.ok) {
          const html = await pageResponse.text();

          // Try to extract video URL from embed page
          const videoMatch = html.match(/"video_url":"([^"]+)"/);
          if (videoMatch) {
            videoUrl = videoMatch[1].replace(/\\u0026/g, '&');
          }

          // Extract thumbnail
          const thumbMatch = html.match(/"thumbnail_src":"([^"]+)"/);
          if (thumbMatch) {
            thumbnailUrl = thumbMatch[1].replace(/\\u0026/g, '&');
          }
        }
      } catch (e) {
        console.error('Direct extraction error:', e);
      }
    }

    // If we still don't have a video URL, return instructions
    if (!videoUrl) {
      return NextResponse.json({
        error: 'Could not automatically download this reel. Please try one of these options:\n' +
          '1. Download the reel manually using saveig.app or snapinsta.app\n' +
          '2. Upload the video to a hosting service (Cloudinary, etc.)\n' +
          '3. Paste the direct video URL in the form',
        manual_download_urls: [
          `https://saveig.app/en/instagram-reels-downloader?url=${encodeURIComponent(url)}`,
          `https://snapinsta.app/instagram-reels-downloader?url=${encodeURIComponent(url)}`,
        ],
      }, { status: 422 });
    }

    // Generate caption with AI if requested
    let generatedCaption = '';
    if (generate_caption && GROQ_API_KEY) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are a social media expert for WealthClaude, a financial education platform.
Create an engaging caption for an Instagram Reel about finance/investing.

Rules:
- Start with a hook (question or bold statement)
- Keep it concise but engaging
- Include a call-to-action
- Add relevant emojis
- Include 5-8 relevant hashtags at the end
- Make it viral-worthy`
              },
              {
                role: 'user',
                content: caption
                  ? `Create a new engaging caption based on this original caption: "${caption}"`
                  : 'Create an engaging caption for a finance/investing reel'
              }
            ],
            max_tokens: 300,
            temperature: 0.8,
          }),
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          generatedCaption = groqData.choices?.[0]?.message?.content || '';
        }
      } catch (e) {
        console.error('Caption generation error:', e);
      }
    }

    return NextResponse.json({
      success: true,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      original_caption: caption,
      caption: generatedCaption || caption,
      shortcode: shortcode,
    });

  } catch (error: any) {
    console.error('Error importing reel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import reel' },
      { status: 500 }
    );
  }
}