// app/api/settings/route.ts
// Settings management endpoint

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch settings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      // If no settings exist, create default
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: createError } = await supabase
          .from('settings')
          .insert({})
          .select()
          .single()

        if (createError) throw createError
        return NextResponse.json(newSettings)
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update settings
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    
    // Get existing settings ID
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('settings')
      .update(body)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error

    // Log settings change
    await supabase.from('activity_log').insert({
      action: 'settings_changed',
      description: 'Settings updated',
      status: 'Ready',
      metadata: { changed_fields: Object.keys(body) }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
