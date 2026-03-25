import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeSubscription(
  table: string,
  callback: (event: any) => void
) {
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe((status) => {
        console.log(`[v0] Realtime status for ${table}:`, status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, callback])
}
