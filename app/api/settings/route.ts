import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') throw error

    // Return default structure if no settings exist
    const defaultSettings = {
      autoPost: false,
      maxPostsPerDay: 5,
      connectedAccounts: {
        youtube: { connected: false },
        twitter: { connected: false },
        instagram: { connected: false },
        linkedin: { connected: false },
      },
    }

    return NextResponse.json(data ? { ...defaultSettings, ...data } : defaultSettings)
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Try to update, if no row exists, insert
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .single()

    let data, error

    if (existing) {
      ;({ data, error } = await supabase
        .from('settings')
        .update(body)
        .eq('id', existing.id)
        .select())
    } else {
      ;({ data, error } = await supabase
        .from('settings')
        .insert([body])
        .select())
    }

    if (error) throw error

    return NextResponse.json(data?.[0] || {})
  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
