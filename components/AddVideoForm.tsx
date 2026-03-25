// components/AddVideoForm.tsx
// A working form to add YouTube URLs to the queue

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, Check, AlertCircle } from 'lucide-react';

interface AddVideoFormProps {
  onSuccess?: () => void; // Called after successful add (e.g., to refresh the list)
}

export function AddVideoForm({ onSuccess }: AddVideoFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add video');
      }

      // Success!
      setStatus('success');
      setMessage('Video added to queue!');
      setUrl(''); // Clear input

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);

    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Video</CardTitle>
        <CardDescription>Paste a YouTube URL to add it to the processing queue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Process
                </>
              )}
            </Button>
          </div>

          {/* Status message */}
          {status !== 'idle' && (
            <div className={`flex items-center gap-2 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
              {status === 'success' ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {message}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
