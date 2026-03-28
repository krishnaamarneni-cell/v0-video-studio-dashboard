// app/api/social/generate/route.ts
// API routes for AI content generation

import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

// POST - Generate content with AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, prompt, template, platform } = body
    
    if (type === 'text') {
      // Generate text with Groq
      const systemPrompt = getSystemPrompt(template)
      
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 500
      })
      
      const generatedText = completion.choices[0]?.message?.content || ''
      
      return NextResponse.json({ 
        success: true,
        text: generatedText 
      })
      
    } else if (type === 'image') {
      // Generate image with Fal.ai
      const imageUrl = await generateImage(prompt, template, platform)
      
      if (imageUrl) {
        return NextResponse.json({ 
          success: true,
          imageUrl 
        })
      } else {
        return NextResponse.json({ 
          success: false,
          error: 'Failed to generate image' 
        }, { status: 500 })
      }
      
    } else if (type === 'hashtags') {
      // Generate hashtags
      const hashtags = await generateHashtags(prompt)
      
      return NextResponse.json({ 
        success: true,
        hashtags 
      })
      
    } else {
      return NextResponse.json({ 
        error: 'Invalid generation type' 
      }, { status: 400 })
    }
    
  } catch (error: any) {
    console.error('Generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getSystemPrompt(template: string): string {
  const templates: Record<string, string> = {
    quote_card: `You are a social media content creator for WealthClaude, a finance brand.
Create an inspiring or educational quote/tip about finance, investing, or wealth building.
Keep it under 200 characters. Be memorable and shareable.
Do NOT include hashtags.`,
    
    breaking_news: `You are a financial news writer for WealthClaude.
Create a concise, attention-grabbing news update about markets or finance.
Use an urgent but professional tone. Keep under 250 characters.
Do NOT include hashtags.`,
    
    meme: `You are a social media content creator for WealthClaude.
Create a witty, relatable, and shareable post about finance, investing, or money.
Be casual and humorous while still being informative. Keep under 200 characters.
Do NOT include hashtags.`,
    
    professional: `You are a social media content creator for WealthClaude, a finance brand.
Create professional, informative content about finance, investing, and markets.
Be authoritative but approachable. Include a subtle call to action.
Keep under 250 characters. Do NOT include hashtags.`,
    
    market_update: `You are a financial analyst for WealthClaude.
Create a brief market update or analysis. Be factual and insightful.
Use professional language. Keep under 250 characters.
Do NOT include hashtags.`
  }
  
  return templates[template] || templates.professional
}

async function generateImage(
  prompt: string, 
  template: string, 
  platform: string
): Promise<string | null> {
  const falApiKey = process.env.FAL_API_KEY
  
  if (!falApiKey) {
    console.error('FAL_API_KEY not configured')
    return null
  }
  
  const templateStyles: Record<string, { style: string; negative: string }> = {
    quote_card: {
      style: 'minimalist quote card design, clean typography, professional, gradient background with green tones, modern',
      negative: 'cluttered, busy, faces, people'
    },
    breaking_news: {
      style: 'breaking news graphic, bold headlines style, professional news broadcast, red and white accents, modern',
      negative: 'cartoon, unprofessional'
    },
    meme: {
      style: 'viral meme format, bold impact font style, humorous, shareable, eye-catching',
      negative: 'offensive, low quality'
    },
    professional: {
      style: 'professional business graphic, corporate design, green color scheme, sleek minimalist, finance themed',
      negative: 'cartoon, childish, unprofessional'
    },
    market_update: {
      style: 'financial market graphic, stock chart aesthetic, professional, green and white colors, modern finance',
      negative: 'cartoon, unprofessional'
    }
  }
  
  const dimensions: Record<string, { width: number; height: number }> = {
    twitter: { width: 1200, height: 675 },
    instagram_square: { width: 1080, height: 1080 },
    instagram_portrait: { width: 1080, height: 1350 },
    linkedin: { width: 1200, height: 627 }
  }
  
  const style = templateStyles[template] || templateStyles.professional
  const size = dimensions[platform] || dimensions.twitter
  
  const fullPrompt = `${prompt}, ${style.style}, WealthClaude brand, professional finance`
  
  try {
    const response = await fetch('https://fal.run/fal-ai/fast-sdxl', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: style.negative,
        image_size: size,
        num_images: 1,
        enable_safety_checker: true
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      return result.images?.[0]?.url || null
    } else {
      console.error('Fal.ai error:', await response.text())
      return null
    }
  } catch (error) {
    console.error('Fal.ai request error:', error)
    return null
  }
}

async function generateHashtags(text: string): Promise<string[]> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'Generate 5 relevant hashtags for this social media post about finance. Return ONLY the hashtags, one per line, without the # symbol.' 
        },
        { role: 'user', content: text }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 100
    })
    
    const response = completion.choices[0]?.message?.content || ''
    const hashtags = response
      .split('\n')
      .map(tag => tag.trim().replace('#', ''))
      .filter(tag => tag.length > 0)
      .slice(0, 5)
    
    return hashtags.length > 0 ? hashtags : ['Finance', 'Investing', 'Markets']
  } catch (error) {
    console.error('Hashtag generation error:', error)
    return ['Finance', 'Investing', 'Markets']
  }
}
