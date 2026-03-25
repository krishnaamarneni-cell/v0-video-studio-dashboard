import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[v0] Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function insertTestVideo() {
  console.log('[v0] Inserting test video into video_queue table...')

  try {
    const { data, error } = await supabase
      .from('video_queue')
      .insert([
        {
          source_url: 'https://youtu.be/RYeJoFM5oH4',
          status: 'pending',
          source_type: 'youtube',
          title: 'Test Video - Quick Actions',
          source: 'YouTube',
          duration: '0:00',
        },
      ])
      .select()

    if (error) {
      console.error('[v0] Error inserting test video:', error.message)
      process.exit(1)
    }

    console.log('[v0] Test video inserted successfully:', data)

    // Fetch recent videos to verify
    const { data: videos, error: fetchError } = await supabase
      .from('video_queue')
      .select('id, title, status, source_url, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (fetchError) {
      console.error('[v0] Error fetching videos:', fetchError.message)
      process.exit(1)
    }

    console.log('[v0] Recent videos in queue:')
    console.table(videos)
    console.log('[v0] Test data insertion complete!')
  } catch (err) {
    console.error('[v0] Unexpected error:', err)
    process.exit(1)
  }
}

insertTestVideo()
