# Video Studio - Complete Setup Guide

Automated YouTube/Twitter content pipeline with dashboard.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  VERCEL (Dashboard)         SUPABASE (Database)                 │
│  ┌─────────────────┐        ┌─────────────────┐                │
│  │ • View queue    │◄──────►│ • video_queue   │                │
│  │ • Approve/Skip  │        │ • settings      │                │
│  │ • Settings      │        │ • activity_log  │                │
│  │ • History       │        │ • posting_history│               │
│  └─────────────────┘        └────────┬────────┘                │
│                                      │                          │
│                              ┌───────┴───────┐                  │
│                              │               │                  │
│                              ▼               ▼                  │
│                    ┌─────────────┐  ┌─────────────┐            │
│                    │   LAPTOP    │  │   GITHUB    │            │
│                    │  (Primary)  │  │  (Fallback) │            │
│                    │             │  │             │            │
│                    │ • Download  │  │ • Same code │            │
│                    │ • Process   │  │ • Hourly    │            │
│                    │ • Post      │  │ • Backup    │            │
│                    └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Supabase Setup (5 minutes)

1. Go to your **AIagents** Supabase project
2. Open **SQL Editor**
3. Copy contents of `supabase/schema.sql`
4. Run the query
5. Go to **Settings → API** and copy:
   - Project URL
   - service_role key (secret!)

### 2. Vercel Dashboard Setup (10 minutes)

1. Deploy your v0 project to Vercel
2. Go to **Project Settings → Environment Variables**
3. Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
4. Create the API routes folder in your project:
   ```
   app/api/
   ├── stats/route.ts
   ├── queue/route.ts
   ├── queue/[id]/route.ts
   ├── activity/route.ts
   ├── settings/route.ts
   └── history/route.ts
   ```
5. Copy contents from `api-routes/` folder
6. Redeploy

### 3. Python Processor Setup (15 minutes)

```bash
# Clone/copy python-processor folder
cd python-processor

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install FFmpeg (if not installed)
# Mac: brew install ffmpeg
# Ubuntu: sudo apt install ffmpeg
# Windows: Download from ffmpeg.org

# Copy environment template
cp ../env-templates/.env.processor .env

# Edit .env with your credentials
nano .env
```

### 4. YouTube API Setup (15 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable **YouTube Data API v3**
4. Go to **Credentials → Create Credentials → OAuth client ID**
5. Application type: **Desktop app**
6. Download JSON and save as `client_secrets.json` in python-processor/scripts/
7. First run will open browser for authentication:
   ```bash
   cd scripts
   python youtube_uploader.py auth
   ```

### 5. Twitter/X API Setup (Optional, 10 minutes)

1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. Create app (you already have this)
3. Get your keys and add to `.env`:
   ```
   TWITTER_API_KEY=xxx
   TWITTER_API_SECRET=xxx
   TWITTER_ACCESS_TOKEN=xxx
   TWITTER_ACCESS_SECRET=xxx
   ```

### 6. Run the Processor

```bash
cd python-processor/scripts

# Run continuously (polls every 30 seconds)
python processor.py

# Or run once
python processor.py --once
```

## Usage

### Dashboard Workflow

1. **Paste URL** in Quick Actions → Click Process
2. Processor downloads and processes video
3. Video appears in **Queue** with status "Ready"
4. Click **Approve** to queue for posting
5. If auto-post enabled, processor posts automatically
6. View results in **History**

### Settings

- **Auto-post mode**: Processor posts approved videos automatically
- **Review mode**: Videos stay in queue until you click "Post Now"
- **Max posts per day**: Daily limit (default 10)
- **Add logo**: Watermark videos with your logo

## File Structure

```
video-studio-complete/
├── supabase/
│   └── schema.sql              # Run in Supabase SQL Editor
│
├── api-routes/                 # Copy to your Vercel project
│   ├── stats/route.ts
│   ├── queue/route.ts
│   ├── queue/[id]/route.ts
│   ├── activity/route.ts
│   ├── settings/route.ts
│   └── history/route.ts
│
├── python-processor/           # Runs on laptop/GitHub Actions
│   ├── scripts/
│   │   ├── processor.py        # Main processor
│   │   ├── video_downloader.py
│   │   ├── video_processor.py
│   │   ├── ai_generator.py
│   │   ├── youtube_uploader.py
│   │   ├── twitter_poster.py
│   │   └── pipeline.py
│   ├── .github/workflows/
│   │   └── process.yml         # GitHub Actions fallback
│   └── requirements.txt
│
└── env-templates/
    ├── .env.vercel             # For Vercel
    └── .env.processor          # For Python processor
```

## GitHub Actions Fallback

To run processing when laptop is off:

1. Create new GitHub repo for python-processor
2. Push the code
3. Add secrets in **Settings → Secrets → Actions**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `GROQ_API_KEY`
   - `YOUTUBE_CREDENTIALS` (contents of client_secrets.json)
   - `TWITTER_API_KEY`, etc.

Workflow runs hourly automatically.

## Troubleshooting

### "No module named 'xxx'"
```bash
pip install -r requirements.txt
```

### "FFmpeg not found"
```bash
# Mac
brew install ffmpeg

# Ubuntu
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### YouTube auth error
```bash
# Re-authenticate
rm token.pickle
python youtube_uploader.py auth
```

### Supabase connection error
- Check your URL and key in .env
- Make sure service_role key is used (not anon key)

## Next Steps

- [ ] Run Supabase schema
- [ ] Deploy dashboard to Vercel
- [ ] Add API routes
- [ ] Set up Python processor
- [ ] Configure YouTube API
- [ ] Add logo.png
- [ ] Test with a video URL
- [ ] Enable auto-posting

## Support

For issues, check:
1. Supabase logs (Database → Logs)
2. Vercel logs (Deployments → View Logs)
3. Python processor output (terminal)
