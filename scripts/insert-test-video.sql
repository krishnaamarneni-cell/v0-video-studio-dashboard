-- Insert test video into video_queue table
INSERT INTO public.video_queue (
  source_url,
  status,
  source_type,
  title,
  source,
  duration
) VALUES (
  'https://youtu.be/RYeJoFM5oH4',
  'pending',
  'youtube',
  'Test Video - Quick Actions',
  'YouTube',
  '0:00'
) ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT id, title, status, source_url, created_at FROM public.video_queue 
ORDER BY created_at DESC 
LIMIT 5;
