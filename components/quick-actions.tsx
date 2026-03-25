// components/quick-actions.tsx
// Fixed Quick Actions card with working Process button

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Loader2, Check, AlertCircle } from 'lucide-react';

export function QuickActions() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleProcess = async () => {
    if (!url.trim()) {
      setStatus('error');
      setMessage('Please enter a URL');
      return;
    }

    // Basic YouTube URL validation
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      setStatus('error');
      setMessage('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: url.trim(),
          source_type: 'youtube',
          platforms: ['youtube']
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add video');
      }

      // Success!
      setStatus('success');
      setMessage('Video added to queue!');
      setUrl(''); // Clear input

      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error adding video:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Add a video URL to process</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleProcess();
                }
              }}
            />
            <Button onClick={handleProcess} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Process
                </>
              )}
            </Button>
          </div>

          {/* Status message */}
          {status !== 'idle' && (
            <div className={`flex items-center gap-2 text-sm ${status === 'success' ? 'text-green-500' : 'text-red-500'
              }`}>
              {status === 'success' ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
