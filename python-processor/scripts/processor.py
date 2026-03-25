"""
Video Studio Processor
Main script that runs on your laptop/GitHub Actions
Polls Supabase for new videos and processes them
"""

import os
import sys
import time
import json
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from supabase import create_client, Client

# Import our modules
from video_downloader import VideoDownloader
from video_processor import VideoProcessor
from ai_generator import AIGenerator, ThumbnailGenerator
from youtube_uploader import YouTubeUploader
from twitter_poster import TwitterPoster

# Load environment variables
load_dotenv()


class VideoStudioProcessor:
    """Main processor that coordinates all video processing"""
    
    def __init__(self):
        # Initialize Supabase
        self.supabase: Client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_KEY')
        )
        
        # Initialize modules
        self.downloader = VideoDownloader()
        self.processor = VideoProcessor()
        self.ai = AIGenerator()
        self.thumbnail_gen = ThumbnailGenerator()
        
        # Initialize uploaders
        self.youtube = YouTubeUploader()
        self.twitter = TwitterPoster()
        
        # Settings
        self.poll_interval = int(os.getenv('POLL_INTERVAL_SECONDS', 30))
        self.max_posts_per_day = int(os.getenv('MAX_POSTS_PER_DAY', 10))
        self.max_shorts_per_video = int(os.getenv('MAX_SHORTS_PER_VIDEO', 5))
        self.logo_path = os.getenv('LOGO_PATH', './logo.png')
        self.output_dir = os.getenv('OUTPUT_DIR', './output')
        self.temp_dir = os.getenv('TEMP_DIR', './temp')
        
        # Create directories
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.temp_dir, exist_ok=True)
        
        print("=" * 50)
        print("VIDEO STUDIO PROCESSOR")
        print("=" * 50)
        print(f"Poll interval: {self.poll_interval}s")
        print(f"Max posts/day: {self.max_posts_per_day}")
        print(f"YouTube: {'✓ Connected' if self.youtube.is_authenticated() else '✗ Not connected'}")
        print(f"Twitter: {'✓ Connected' if self.twitter.is_connected() else '✗ Not connected'}")
        print("=" * 50)
    
    def get_settings(self) -> Dict[str, Any]:
        """Get settings from Supabase"""
        try:
            result = self.supabase.table('settings').select('*').limit(1).execute()
            if result.data:
                return result.data[0]
            return {}
        except Exception as e:
            print(f"Error getting settings: {e}")
            return {}
    
    def get_pending_items(self) -> List[Dict[str, Any]]:
        """Get items that need processing"""
        try:
            result = self.supabase.table('video_queue')\
                .select('*')\
                .eq('status', 'pending')\
                .order('created_at')\
                .limit(5)\
                .execute()
            return result.data or []
        except Exception as e:
            print(f"Error getting pending items: {e}")
            return []
    
    def get_approved_items(self) -> List[Dict[str, Any]]:
        """Get items ready to post"""
        try:
            result = self.supabase.table('video_queue')\
                .select('*')\
                .eq('status', 'approved')\
                .order('approved_at')\
                .limit(10)\
                .execute()
            return result.data or []
        except Exception as e:
            print(f"Error getting approved items: {e}")
            return []
    
    def get_today_post_count(self) -> int:
        """Get number of posts made today"""
        try:
            today = date.today().isoformat()
            result = self.supabase.table('posting_history')\
                .select('id', count='exact')\
                .gte('posted_at', today)\
                .execute()
            return result.count or 0
        except Exception as e:
            print(f"Error getting post count: {e}")
            return 0
    
    def update_item(self, item_id: str, updates: Dict[str, Any]):
        """Update a queue item"""
        try:
            self.supabase.table('video_queue')\
                .update(updates)\
                .eq('id', item_id)\
                .execute()
        except Exception as e:
            print(f"Error updating item {item_id}: {e}")
    
    def log_activity(self, action: str, description: str, status: str, video_id: str = None):
        """Log an activity"""
        try:
            self.supabase.table('activity_log').insert({
                'action': action,
                'description': description,
                'status': status,
                'video_id': video_id
            }).execute()
        except Exception as e:
            print(f"Error logging activity: {e}")
    
    def add_posting_history(
        self,
        video_id: str,
        platform: str,
        platform_post_id: str,
        platform_url: str,
        title: str
    ):
        """Add entry to posting history"""
        try:
            self.supabase.table('posting_history').insert({
                'video_id': video_id,
                'platform': platform,
                'platform_post_id': platform_post_id,
                'platform_url': platform_url,
                'title': title,
                'status': 'posted'
            }).execute()
        except Exception as e:
            print(f"Error adding posting history: {e}")
    
    def process_video(self, item: Dict[str, Any]) -> bool:
        """Process a single video (download, analyze, create clips)"""
        item_id = item['id']
        url = item['source_url']
        
        print(f"\n→ Processing: {url}")
        
        try:
            # Update status
            self.update_item(item_id, {'status': 'processing'})
            
            # Download video
            print("  Downloading...")
            video_path = self.downloader.download(url, self.temp_dir)
            if not video_path:
                raise Exception("Download failed")
            
            # Get video info
            info = self.downloader.get_info(url)
            title = info.get('title', 'Untitled')
            duration = info.get('duration', 0)
            
            # Get transcript if available
            transcript = self.downloader.get_transcript(url, self.temp_dir)
            
            # Analyze with AI
            print("  Analyzing with AI...")
            analysis = {}
            if transcript:
                analysis = self.ai.analyze_transcript(transcript)
            
            # Generate AI metadata
            ai_title = self.ai.generate_title(title, 'short' if duration < 60 else 'long')
            ai_description = self.ai.generate_description(title, item['source_type'])
            ai_tags = self.ai.generate_tags(title)
            
            # Add logo if exists
            if os.path.exists(self.logo_path):
                print("  Adding logo...")
                processed_path = video_path.replace('.mp4', '_logo.mp4')
                self.processor.add_logo(video_path, self.logo_path, processed_path)
                video_path = processed_path
            
            # Determine video type
            video_type = 'short' if duration < 60 else 'long'
            
            # Update item with processed info
            self.update_item(item_id, {
                'status': 'ready',
                'source_title': title,
                'duration_seconds': duration,
                'video_type': video_type,
                'processed_video_url': video_path,
                'ai_title': ai_title[0] if ai_title else title,
                'ai_description': ai_description,
                'ai_tags': ai_tags,
                'processed_at': datetime.now().isoformat()
            })
            
            self.log_activity(
                'video_processed',
                f'Video processed: {title[:50]}',
                'Ready',
                item_id
            )
            
            print(f"  ✓ Processed successfully")
            return True
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
            self.update_item(item_id, {
                'status': 'failed',
                'error_message': str(e)
            })
            return False
    
    def post_video(self, item: Dict[str, Any], settings: Dict[str, Any]) -> bool:
        """Post a video to all configured platforms"""
        item_id = item['id']
        title = item.get('ai_title') or item.get('source_title') or 'Untitled'
        description = item.get('ai_description') or ''
        video_path = item.get('processed_video_url')
        platforms = item.get('platforms', ['youtube'])
        
        print(f"\n→ Posting: {title[:50]}...")
        
        posted_to = []
        
        try:
            # Post to YouTube
            if 'youtube' in platforms and settings.get('youtube_connected'):
                print("  Posting to YouTube...")
                if self.youtube.is_authenticated():
                    result = self.youtube.upload_video(
                        video_path=video_path,
                        title=title[:100],
                        description=description,
                        tags=item.get('ai_tags', []),
                        category_id='25',  # News & Politics
                        privacy_status='public'
                    )
                    if result:
                        self.add_posting_history(
                            item_id, 'youtube',
                            result['id'],
                            f"https://youtube.com/watch?v={result['id']}",
                            title
                        )
                        self.update_item(item_id, {'youtube_video_id': result['id']})
                        posted_to.append('youtube')
                        print(f"  ✓ YouTube: https://youtube.com/watch?v={result['id']}")
            
            # Post to Twitter
            if 'twitter' in platforms and settings.get('twitter_connected'):
                print("  Posting to Twitter...")
                if self.twitter.is_connected():
                    # Create tweet text
                    tweet_text = f"{title[:200]}\n\n#Markets #Finance"
                    
                    result = self.twitter.post_with_video(tweet_text, video_path)
                    if result:
                        self.add_posting_history(
                            item_id, 'twitter',
                            result['id'],
                            result['url'],
                            title
                        )
                        self.update_item(item_id, {'twitter_post_id': result['id']})
                        posted_to.append('twitter')
                        print(f"  ✓ Twitter: {result['url']}")
            
            # Update status
            if posted_to:
                self.update_item(item_id, {
                    'status': 'posted',
                    'posted_platforms': posted_to,
                    'posted_at': datetime.now().isoformat()
                })
                
                self.log_activity(
                    'video_posted',
                    f'Posted to {", ".join(posted_to)}',
                    'Posted',
                    item_id
                )
                return True
            else:
                print("  ✗ No platforms to post to")
                return False
                
        except Exception as e:
            print(f"  ✗ Error posting: {e}")
            self.update_item(item_id, {'error_message': str(e)})
            return False
    
    def run_once(self):
        """Run one iteration of processing"""
        settings = self.get_settings()
        
        # Process pending videos
        pending = self.get_pending_items()
        if pending:
            print(f"\nFound {len(pending)} pending videos")
            for item in pending:
                self.process_video(item)
        
        # Post approved videos if auto-post is enabled
        if settings.get('auto_post_enabled'):
            today_count = self.get_today_post_count()
            max_posts = settings.get('max_posts_per_day', self.max_posts_per_day)
            
            if today_count < max_posts:
                approved = self.get_approved_items()
                remaining = max_posts - today_count
                
                if approved:
                    print(f"\nFound {len(approved)} approved videos, can post {remaining} more today")
                    for item in approved[:remaining]:
                        self.post_video(item, settings)
            else:
                print(f"\nReached daily limit ({max_posts} posts)")
    
    def run_loop(self):
        """Run continuously, polling for new work"""
        print(f"\nStarting continuous processing (poll every {self.poll_interval}s)")
        print("Press Ctrl+C to stop\n")
        
        while True:
            try:
                self.run_once()
                print(f"\n⏳ Waiting {self.poll_interval}s...")
                time.sleep(self.poll_interval)
            except KeyboardInterrupt:
                print("\n\nStopping processor...")
                break
            except Exception as e:
                print(f"\n✗ Error in loop: {e}")
                time.sleep(self.poll_interval)


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Video Studio Processor')
    parser.add_argument('--once', action='store_true', help='Run once and exit')
    args = parser.parse_args()
    
    processor = VideoStudioProcessor()
    
    if args.once:
        processor.run_once()
    else:
        processor.run_loop()


if __name__ == '__main__':
    main()
