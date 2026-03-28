// app/api/social/generate/route.ts
// API route to generate AI text (Groq) and images (Fal.ai)

import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const FAL_API_KEY = process.env.FAL_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }

    // Generate text with Groq
    if (type === 'text') {
      if (!GROQ_API_KEY) {
        return NextResponse.json(
          { error: 'Groq API key not configured' },
          { status: 500 }
        );
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
Create engaging, informative posts about finance, investing, and wealth building.

Rules:
- Keep posts concise (under 280 characters for Twitter compatibility)
- Include relevant emojis
- Add 3-5 relevant hashtags at the end
- Be informative but accessible
- Maintain a professional yet friendly tone
- Focus on actionable insights`
            },
            {
              role: 'user',
              content: `Create a social media post about: ${prompt}`
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Groq API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate text' },
          { status: 500 }
        );
      }

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content || '';

      return NextResponse.json({
        success: true,
        text: generatedText,
      });
    }

    // Generate image with Fal.ai
    if (type === 'image') {
      if (!FAL_API_KEY) {
        return NextResponse.json(
          { error: 'Fal.ai API key not configured' },
          { status: 500 }
        );
      }

      // Enhanced prompt for better social media images
      const enhancedPrompt = `Professional social media graphic: ${prompt}. 
Style: Modern, clean design, vibrant colors, high quality, suitable for Instagram and LinkedIn, 
no text overlay, professional business aesthetic, square format.`;

      const response = await fetch('https://fal.run/fal-ai/fast-sdxl', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          image_size: 'square_hd',
          num_inference_steps: 25,
          guidance_scale: 7.5,
          num_images: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Fal.ai API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate image' },
          { status: 500 }
        );
      }

      const data = await response.json();
      const imageUrl = data.images?.[0]?.url || '';

      if (!imageUrl) {
        return NextResponse.json(
          { error: 'No image generated' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        image_url: imageUrl,
      });
    }

    // Generate hashtags
    if (type === 'hashtags') {
      if (!GROQ_API_KEY) {
        return NextResponse.json(
          { error: 'Groq API key not configured' },
          { status: 500 }
        );
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
              content: 'Generate 5-10 relevant hashtags for social media posts. Return only hashtags separated by spaces, nothing else.'
            },
            {
              role: 'user',
              content: `Generate hashtags for: ${prompt}`
            }
          ],
          max_tokens: 100,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to generate hashtags' },
          { status: 500 }
        );
      }

      const data = await response.json();
      const hashtags = data.choices?.[0]?.message?.content || '';

      return NextResponse.json({
        success: true,
        hashtags: hashtags.trim(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be: text, image, or hashtags' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error in generate API:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}