-- Create video_queue table
CREATE TABLE IF NOT EXISTS public.video_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT,
  duration TEXT DEFAULT '0:00',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'posted', 'skipped', 'ready')),
  thumbnail TEXT,
  source_url TEXT,
  source_type TEXT DEFAULT 'youtube',
  platform TEXT,
  url TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  posted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.video_queue(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'posted' CHECK (status IN ('pending', 'approved', 'posted', 'skipped', 'ready')),
  platform TEXT,
  views INTEGER DEFAULT 0,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  auto_post BOOLEAN DEFAULT FALSE,
  max_posts_per_day INTEGER DEFAULT 3,
  add_logo BOOLEAN DEFAULT FALSE,
  connected_accounts JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_video_queue_status ON public.video_queue(status);
CREATE INDEX IF NOT EXISTS idx_video_queue_created_at ON public.video_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_status ON public.activity_log(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- Grant permissions
ALTER TABLE public.video_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anonymous access (for now - adjust as needed)
CREATE POLICY "video_queue_anon_select" ON public.video_queue FOR SELECT TO anon USING (true);
CREATE POLICY "video_queue_anon_insert" ON public.video_queue FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "activity_log_anon_select" ON public.activity_log FOR SELECT TO anon USING (true);
CREATE POLICY "settings_anon_select" ON public.settings FOR SELECT TO anon USING (true);
