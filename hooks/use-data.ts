import useSWR from 'swr'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useStats() {
  const { data, error, isLoading } = useSWR('/api/stats', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  return {
    stats: data,
    isLoading,
    error,
  }
}

export function useQueue(status?: string) {
  const url = status && status !== 'all' 
    ? `/api/queue?status=${status}`
    : '/api/queue'

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateOnMount: true,
  })

  // Subscribe to real-time changes
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('video_queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_queue',
        },
        () => {
          // Revalidate data on any change
          mutate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mutate])

  return {
    videos: data || [],
    isLoading,
    error,
    mutate,
  }
}

export function useActivity(dateFrom?: string, dateTo?: string) {
  let url = '/api/activity'
  const params = new URLSearchParams()
  
  if (dateFrom) params.append('dateFrom', dateFrom)
  if (dateTo) params.append('dateTo', dateTo)
  
  if (params.toString()) {
    url += `?${params.toString()}`
  }

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateOnMount: true,
  })

  // Subscribe to real-time changes
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('activity_log_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_log',
        },
        () => {
          // Revalidate data on any change
          mutate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mutate])

  return {
    activities: data || [],
    isLoading,
    error,
    mutate,
  }
}

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateOnMount: true,
  })

  // Subscribe to real-time changes
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings',
        },
        () => {
          // Revalidate data on any change
          mutate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mutate])

  return {
    settings: data,
    isLoading,
    error,
    mutate,
  }
}
