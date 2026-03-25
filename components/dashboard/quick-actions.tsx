'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useQueue, useStats } from '@/hooks/use-data'

export function QuickActions() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { mutate: mutateQueue } = useQueue()
  const { mutate: mutateStats } = useStats()

  const handleProcess = async () => {
    console.log('[v0] Process button clicked, URL:', url)

    if (!url.trim()) {
      console.log('[v0] URL is empty')
      toast({
        title: 'Error',
        description: 'Please enter a URL',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('[v0] Sending POST request to /api/queue with URL:', url)
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceUrl: url,
          title: 'Processing video...',
          status: 'pending',
        }),
      })

      console.log('[v0] Response status:', response.status)
      const data = await response.json()
      console.log('[v0] Response data:', data)

      if (!response.ok) {
        console.error('[v0] API error details:', { status: response.status, error: data.error, fullData: data })
        throw new Error(data.error || `Failed to process video (${response.status})`)
      }

      console.log('[v0] Video added successfully:', data)
      toast({
        title: 'Success',
        description: 'Video added to queue',
      })

      // Clear input
      setUrl('')

      // Refresh data
      console.log('[v0] Refreshing queue and stats')
      await mutateQueue()
      await mutateStats()
    } catch (error) {
      console.error('[v0] Error processing video:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process video'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleProcess()
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">Quick Actions</h2>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Paste YouTube URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          className="bg-input border-border text-card-foreground placeholder:text-muted-foreground"
        />
        <Button
          onClick={handleProcess}
          disabled={isLoading}
          className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Play size={16} />
          {isLoading ? 'Processing...' : 'Process'}
        </Button>
      </div>
    </Card>
  )
}
