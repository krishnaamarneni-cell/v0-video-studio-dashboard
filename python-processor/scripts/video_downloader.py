"""
Video Downloader Module
Downloads videos from YouTube and other sources using yt-dlp
"""

import os
import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoDownloader:
    def __init__(self, download_dir: str = "./downloads"):
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(parents=True, exist_ok=True)
        
    def download_video(
        self, 
        url: str, 
        output_name: Optional[str] = None,
        quality: str = "best[height<=1080]"
    ) -> Dict[str, Any]:
        """
        Download a video from URL
        
        Args:
            url: Video URL (YouTube, C-SPAN, etc.)
            output_name: Optional custom filename (without extension)
            quality: yt-dlp format selection
            
        Returns:
            Dict with video info and file path
        """
        try:
            # First, get video info without downloading
            info = self._get_video_info(url)
            
            if not info:
                return {"success": False, "error": "Could not fetch video info"}
            
            video_id = info.get("id", "unknown")
            
            # Set output filename
            if output_name:
                filename = f"{output_name}.%(ext)s"
            else:
                # Clean title for filename
                safe_title = self._sanitize_filename(info.get("title", video_id))
                filename = f"{safe_title}.%(ext)s"
            
            output_path = self.download_dir / filename
            
            # Download command
            cmd = [
                "yt-dlp",
                "-f", quality,
                "-o", str(output_path),
                "--write-info-json",
                "--write-thumbnail",
                "--no-playlist",
                url
            ]
            
            logger.info(f"Downloading: {info.get('title', url)}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"Download failed: {result.stderr}")
                return {"success": False, "error": result.stderr}
            
            # Find the downloaded file
            downloaded_file = self._find_downloaded_file(output_path)
            
            return {
                "success": True,
                "file_path": str(downloaded_file),
                "video_id": video_id,
                "title": info.get("title"),
                "description": info.get("description"),
                "duration": info.get("duration"),
                "thumbnail_url": info.get("thumbnail"),
                "channel": info.get("channel"),
                "upload_date": info.get("upload_date"),
                "view_count": info.get("view_count"),
            }
            
        except Exception as e:
            logger.error(f"Download error: {e}")
            return {"success": False, "error": str(e)}
    
    def _get_video_info(self, url: str) -> Optional[Dict]:
        """Get video metadata without downloading"""
        cmd = ["yt-dlp", "-j", "--no-playlist", url]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            return json.loads(result.stdout)
        return None
    
    def _sanitize_filename(self, filename: str, max_length: int = 100) -> str:
        """Make filename safe for filesystem"""
        # Remove/replace problematic characters
        chars_to_remove = '<>:"/\\|?*'
        for char in chars_to_remove:
            filename = filename.replace(char, '')
        
        # Replace spaces with underscores
        filename = filename.replace(' ', '_')
        
        # Truncate if too long
        if len(filename) > max_length:
            filename = filename[:max_length]
        
        return filename
    
    def _find_downloaded_file(self, output_template: Path) -> Path:
        """Find the actual downloaded file (extension may vary)"""
        base = output_template.with_suffix('')
        
        # Common video extensions
        extensions = ['.mp4', '.webm', '.mkv', '.mov', '.avi']
        
        for ext in extensions:
            candidate = base.parent / f"{base.name}{ext}"
            # Handle yt-dlp's template expansion
            for file in base.parent.glob(f"{base.stem}*{ext}"):
                if file.exists():
                    return file
        
        # Fallback: find any recently created video file
        for file in sorted(base.parent.glob("*"), key=os.path.getmtime, reverse=True):
            if file.suffix.lower() in extensions:
                return file
        
        return base.with_suffix('.mp4')  # Default assumption
    
    def get_transcript(self, url: str) -> Optional[str]:
        """
        Get video transcript/captions
        
        Args:
            url: Video URL
            
        Returns:
            Transcript text or None
        """
        try:
            cmd = [
                "yt-dlp",
                "--write-auto-sub",
                "--skip-download",
                "--sub-format", "vtt",
                "--sub-lang", "en",
                "-o", str(self.download_dir / "%(id)s"),
                url
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            # Find the subtitle file
            for file in self.download_dir.glob("*.vtt"):
                with open(file, 'r') as f:
                    content = f.read()
                # Clean up the VTT format
                transcript = self._clean_vtt(content)
                # Remove the file after reading
                file.unlink()
                return transcript
            
            # Try getting auto-generated captions
            info = self._get_video_info(url)
            if info and "automatic_captions" in info:
                # Get English auto-captions
                en_caps = info.get("automatic_captions", {}).get("en", [])
                if en_caps:
                    # Would need to download and parse
                    pass
            
            return None
            
        except Exception as e:
            logger.error(f"Transcript error: {e}")
            return None
    
    def _clean_vtt(self, vtt_content: str) -> str:
        """Clean VTT subtitle format to plain text"""
        lines = vtt_content.split('\n')
        text_lines = []
        
        for line in lines:
            line = line.strip()
            # Skip timing lines, headers, and empty lines
            if not line:
                continue
            if line.startswith('WEBVTT'):
                continue
            if '-->' in line:
                continue
            if line.isdigit():
                continue
            # Remove HTML tags
            import re
            line = re.sub(r'<[^>]+>', '', line)
            if line:
                text_lines.append(line)
        
        return ' '.join(text_lines)
    
    def download_thumbnail(self, url: str, output_path: str) -> bool:
        """Download just the thumbnail"""
        try:
            cmd = [
                "yt-dlp",
                "--write-thumbnail",
                "--skip-download",
                "--convert-thumbnails", "png",
                "-o", output_path,
                url
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Thumbnail download error: {e}")
            return False


# CLI usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python video_downloader.py <url>")
        sys.exit(1)
    
    downloader = VideoDownloader()
    result = downloader.download_video(sys.argv[1])
    
    if result["success"]:
        print(f"✅ Downloaded: {result['file_path']}")
        print(f"   Title: {result['title']}")
        print(f"   Duration: {result['duration']}s")
    else:
        print(f"❌ Failed: {result['error']}")
