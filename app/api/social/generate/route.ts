// app/api/social/generate/route.ts
// API route to generate AI text, images, and auto-prompts

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

    // Generate social media text with Groq
    if (type === 'text') {
      if (!GROQ_API_KEY) {
        return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
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
- Keep posts concise (under 280 characters ideal, max 500)
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
        return NextResponse.json({ error: 'Failed to generate text' }, { status: 500 });
      }

      const data = await response.json();
      return NextResponse.json({
        success: true,
        text: data.choices?.[0]?.message?.content || '',
      });
    }

    // NEW: Generate image prompt from text content
    if (type === 'image_prompt') {
      if (!GROQ_API_KEY) {
        return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
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
              content: `You are an expert at creating image generation prompts for AI image generators like Stable Diffusion.

Given a social media post text, create a detailed image prompt that would make a visually appealing, professional social media graphic.

Rules:
- Create a descriptive prompt for an image that matches the post's topic
- Include style descriptors: "professional", "modern", "clean design"
- Mention colors that fit the theme (use green for finance/money topics)
- Specify format: "square format", "social media graphic"
- Include visual elements that represent the topic
- DO NOT include any text in the image
- Keep the prompt under 150 words
- Output ONLY the prompt, nothing else`
            },
            {
              role: 'user',
              content: `Create an image prompt for this social media post:\n\n${prompt}`
            }
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to generate image prompt' }, { status: 500 });
      }

      const data = await response.json();
      const imagePrompt = data.choices?.[0]?.message?.content || '';

      return NextResponse.json({
        success: true,
        image_prompt: imagePrompt.trim(),
      });
    }

    // NEW: Generate caption for reel/video
    if (type === 'reel_caption') {
      if (!GROQ_API_KEY) {
        return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
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
              content: `You are a social media expert specializing in Instagram Reels and short-form video content.
Create engaging captions for finance and investing video content.

Rules:
- Start with a hook (question or bold statement)
- Keep it concise (under 200 characters before hashtags)
- Include a call-to-action (follow, save, share)
- Add relevant emojis
- Include 5-8 relevant hashtags
- Make it engaging and shareable`
            },
            {
              role: 'user',
              content: `Create an engaging caption for a finance/investing reel about: ${prompt}`
            }
          ],
          max_tokens: 300,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 });
      }

      const data = await response.json();
      return NextResponse.json({
        success: true,
        text: data.choices?.[0]?.message?.content || '',
      });
    }

    // Generate image with Fal.ai
    if (type === 'image') {
      if (!FAL_API_KEY) {
        return NextResponse.json({ error: 'Fal.ai API key not configured' }, { status: 500 });
      }

      // Enhanced prompt for better social media images
      const enhancedPrompt = `${prompt}. 
Style: Modern, clean design, vibrant colors, high quality, suitable for Instagram and LinkedIn, 
no text overlay, professional business aesthetic, square format, 4K quality.`;

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
        return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
      }

      const data = await response.json();
      const imageUrl = data.images?.[0]?.url || '';

      if (!imageUrl) {
        return NextResponse.json({ error: 'No image generated' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        image_url: imageUrl,
      });
    }

    // Generate hashtags
    if (type === 'hashtags') {
      if (!GROQ_API_KEY) {
        return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
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
        return NextResponse.json({ error: 'Failed to generate hashtags' }, { status: 500 });
      }

      const data = await response.json();
      return NextResponse.json({
        success: true,
        hashtags: data.choices?.[0]?.message?.content?.trim() || '',
      });
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be: text, image, image_prompt, reel_caption, or hashtags' },
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