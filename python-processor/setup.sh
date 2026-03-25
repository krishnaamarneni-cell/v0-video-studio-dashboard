#!/bin/bash

# Video Studio Processor Setup Script
# Run this on your laptop to set up the processing environment

set -e

echo "============================================"
echo "  VIDEO STUDIO PROCESSOR SETUP"
echo "============================================"
echo ""

# Check Python
echo "Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON=python3
    echo "✓ Python 3 found: $(python3 --version)"
elif command -v python &> /dev/null; then
    PYTHON=python
    echo "✓ Python found: $(python --version)"
else
    echo "✗ Python not found. Please install Python 3.9+"
    exit 1
fi

# Check FFmpeg
echo ""
echo "Checking FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    echo "✓ FFmpeg found: $(ffmpeg -version | head -n1)"
else
    echo "✗ FFmpeg not found."
    echo ""
    echo "Install FFmpeg:"
    echo "  Mac:    brew install ffmpeg"
    echo "  Ubuntu: sudo apt install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org/download.html"
    exit 1
fi

# Check yt-dlp
echo ""
echo "Checking yt-dlp..."
if command -v yt-dlp &> /dev/null; then
    echo "✓ yt-dlp found: $(yt-dlp --version)"
else
    echo "⚠ yt-dlp not found (will be installed via pip)"
fi

# Create virtual environment
echo ""
echo "Creating virtual environment..."
if [ -d "venv" ]; then
    echo "✓ Virtual environment already exists"
else
    $PYTHON -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Activated"

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Dependencies installed"

# Create directories
echo ""
echo "Creating directories..."
mkdir -p output temp
echo "✓ Directories created"

# Create .env if not exists
echo ""
if [ ! -f ".env" ]; then
    echo "Creating .env template..."
    cat > .env << 'EOF'
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Groq AI
GROQ_API_KEY=your-groq-api-key

# YouTube (after running: python scripts/youtube_uploader.py auth)
YOUTUBE_CLIENT_SECRETS_PATH=./client_secrets.json

# Twitter/X (optional)
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

# Settings
MAX_SHORTS_PER_VIDEO=5
MAX_POSTS_PER_DAY=10
POLL_INTERVAL_SECONDS=30
LOGO_PATH=./logo.png
OUTPUT_DIR=./output
TEMP_DIR=./temp
EOF
    echo "✓ .env template created"
    echo ""
    echo "⚠ IMPORTANT: Edit .env with your credentials!"
else
    echo "✓ .env already exists"
fi

# Summary
echo ""
echo "============================================"
echo "  SETUP COMPLETE!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env with your credentials:"
echo "   nano .env"
echo ""
echo "2. Add your logo:"
echo "   cp /path/to/your/logo.png ./logo.png"
echo ""
echo "3. Set up YouTube API (first time only):"
echo "   cd scripts"
echo "   python youtube_uploader.py auth"
echo ""
echo "4. Run the processor:"
echo "   source venv/bin/activate"
echo "   cd scripts"
echo "   python processor.py"
echo ""
echo "============================================"
