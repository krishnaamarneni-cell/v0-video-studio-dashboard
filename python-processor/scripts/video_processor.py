"""
Video Processor Module
Uses FFmpeg to add logos, extract clips, and process videos for YouTube
"""

import os
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VideoProcessor:
    def __init__(
        self, 
        output_dir: str = "./processed",
        logo_path: Optional[str] = None
    ):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.logo_path = logo_path
        
        # Logo position presets (for 1920x1080)
        self.logo_positions = {
            "top_left": "10:10",
            "top_right": "W-w-10:10",
            "bottom_left": "10:H-h-10",
            "bottom_right": "W-w-10:H-h-10",
            "center": "(W-w)/2:(H-h)/2"
        }
    
    def add_logo(
        self,
        input_path: str,
        logo_path: Optional[str] = None,
        position: str = "top_right",
        opacity: float = 0.8,
        scale: float = 0.15,  # Logo size relative to video width
        output_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Add logo watermark to video
        
        Args:
            input_path: Path to input video
            logo_path: Path to logo PNG (uses default if not specified)
            position: top_left, top_right, bottom_left, bottom_right, center
            opacity: Logo opacity (0.0 to 1.0)
            scale: Logo scale relative to video width
            output_path: Optional output path
            
        Returns:
            Dict with success status and output path
        """
        try:
            input_path = Path(input_path)
            logo = Path(logo_path) if logo_path else Path(self.logo_path) if self.logo_path else None
            
            if not logo or not logo.exists():
                return {"success": False, "error": "Logo file not found"}
            
            if not input_path.exists():
                return {"success": False, "error": "Input video not found"}
            
            # Generate output path
            if not output_path:
                output_path = self.output_dir / f"{input_path.stem}_branded{input_path.suffix}"
            else:
                output_path = Path(output_path)
            
            # Get video dimensions
            width, height = self._get_video_dimensions(input_path)
            logo_width = int(width * scale)
            
            # Build FFmpeg filter
            pos = self.logo_positions.get(position, self.logo_positions["top_right"])
            
            filter_complex = f"[1:v]scale={logo_width}:-1,format=rgba,colorchannelmixer=aa={opacity}[logo];[0:v][logo]overlay={pos}"
            
            cmd = [
                "ffmpeg", "-y",
                "-i", str(input_path),
                "-i", str(logo),
                "-filter_complex", filter_complex,
                "-c:a", "copy",
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                str(output_path)
            ]
            
            logger.info(f"Adding logo to: {input_path.name}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"FFmpeg error: {result.stderr}")
                return {"success": False, "error": result.stderr}
            
            return {
                "success": True,
                "output_path": str(output_path),
                "logo_position": position,
                "logo_opacity": opacity
            }
            
        except Exception as e:
            logger.error(f"Logo processing error: {e}")
            return {"success": False, "error": str(e)}
    
    def extract_clip(
        self,
        input_path: str,
        start_time: int,
        end_time: int,
        output_path: Optional[str] = None,
        add_logo: bool = True,
        logo_path: Optional[str] = None,
        logo_position: str = "top_right"
    ) -> Dict[str, Any]:
        """
        Extract a clip from video
        
        Args:
            input_path: Path to input video
            start_time: Start time in seconds
            end_time: End time in seconds
            output_path: Optional output path
            add_logo: Whether to add logo to clip
            logo_path: Path to logo
            logo_position: Logo position
            
        Returns:
            Dict with success status and output path
        """
        try:
            input_path = Path(input_path)
            duration = end_time - start_time
            
            if not output_path:
                output_path = self.output_dir / f"{input_path.stem}_clip_{start_time}_{end_time}.mp4"
            else:
                output_path = Path(output_path)
            
            # Extract clip
            cmd = [
                "ffmpeg", "-y",
                "-ss", str(start_time),
                "-i", str(input_path),
                "-t", str(duration),
                "-c:v", "libx264",
                "-c:a", "aac",
                "-preset", "fast",
                str(output_path)
            ]
            
            logger.info(f"Extracting clip: {start_time}s - {end_time}s")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                return {"success": False, "error": result.stderr}
            
            # Add logo if requested
            if add_logo:
                logo = logo_path or self.logo_path
                if logo:
                    branded_path = output_path.parent / f"{output_path.stem}_branded{output_path.suffix}"
                    logo_result = self.add_logo(
                        str(output_path),
                        logo,
                        logo_position,
                        output_path=str(branded_path)
                    )
                    if logo_result["success"]:
                        # Remove unbranded clip
                        output_path.unlink()
                        return {
                            "success": True,
                            "output_path": logo_result["output_path"],
                            "duration": duration,
                            "has_logo": True
                        }
            
            return {
                "success": True,
                "output_path": str(output_path),
                "duration": duration,
                "has_logo": False
            }
            
        except Exception as e:
            logger.error(f"Clip extraction error: {e}")
            return {"success": False, "error": str(e)}
    
    def create_short(
        self,
        input_path: str,
        start_time: int,
        end_time: int,
        text_overlay: Optional[str] = None,
        output_path: Optional[str] = None,
        logo_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a YouTube Short (9:16 vertical video)
        
        Args:
            input_path: Path to input video
            start_time: Start time in seconds
            end_time: End time in seconds
            text_overlay: Optional text to overlay on video
            output_path: Optional output path
            logo_path: Path to logo
            
        Returns:
            Dict with success status and output path
        """
        try:
            input_path = Path(input_path)
            duration = end_time - start_time
            
            if duration > 60:
                logger.warning("Short duration exceeds 60s, YouTube may not treat as Short")
            
            if not output_path:
                output_path = self.output_dir / f"{input_path.stem}_short_{start_time}_{end_time}.mp4"
            else:
                output_path = Path(output_path)
            
            # Build filter for vertical crop (9:16) and optional text
            # Center crop from 16:9 to 9:16
            filters = []
            
            # Crop to center 9:16 from 16:9 source
            # For 1920x1080: crop to 607x1080, then scale to 1080x1920
            filters.append("crop=ih*9/16:ih")
            filters.append("scale=1080:1920")
            
            # Add text overlay if provided
            if text_overlay:
                # Escape special characters for FFmpeg
                safe_text = text_overlay.replace("'", "\\'").replace(":", "\\:")
                filters.append(
                    f"drawtext=text='{safe_text}':"
                    f"fontsize=48:fontcolor=white:borderw=3:bordercolor=black:"
                    f"x=(w-text_w)/2:y=h-150"
                )
            
            filter_str = ",".join(filters)
            
            cmd = [
                "ffmpeg", "-y",
                "-ss", str(start_time),
                "-i", str(input_path),
                "-t", str(duration),
                "-vf", filter_str,
                "-c:v", "libx264",
                "-c:a", "aac",
                "-preset", "fast",
                "-crf", "23",
                str(output_path)
            ]
            
            logger.info(f"Creating Short: {start_time}s - {end_time}s")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"FFmpeg error: {result.stderr}")
                return {"success": False, "error": result.stderr}
            
            # Add logo if provided
            if logo_path or self.logo_path:
                logo = logo_path or self.logo_path
                branded_path = output_path.parent / f"{output_path.stem}_branded{output_path.suffix}"
                logo_result = self.add_logo(
                    str(output_path),
                    logo,
                    position="top_right",
                    scale=0.2,  # Slightly larger for vertical
                    output_path=str(branded_path)
                )
                if logo_result["success"]:
                    output_path.unlink()
                    return {
                        "success": True,
                        "output_path": logo_result["output_path"],
                        "duration": duration,
                        "is_vertical": True,
                        "has_logo": True
                    }
            
            return {
                "success": True,
                "output_path": str(output_path),
                "duration": duration,
                "is_vertical": True,
                "has_logo": False
            }
            
        except Exception as e:
            logger.error(f"Short creation error: {e}")
            return {"success": False, "error": str(e)}
    
    def _get_video_dimensions(self, video_path: Path) -> Tuple[int, int]:
        """Get video width and height"""
        cmd = [
            "ffprobe",
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "json",
            str(video_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            stream = data.get("streams", [{}])[0]
            return stream.get("width", 1920), stream.get("height", 1080)
        
        return 1920, 1080  # Default assumption
    
    def get_duration(self, video_path: str) -> Optional[float]:
        """Get video duration in seconds"""
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "json",
            video_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            return float(data.get("format", {}).get("duration", 0))
        
        return None
    
    def extract_frame(
        self,
        video_path: str,
        timestamp: int,
        output_path: str
    ) -> bool:
        """Extract a single frame as image (for thumbnails)"""
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(timestamp),
            "-i", video_path,
            "-vframes", "1",
            "-q:v", "2",
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0


# CLI usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage:")
        print("  Add logo: python video_processor.py logo <video> <logo.png>")
        print("  Extract clip: python video_processor.py clip <video> <start> <end>")
        print("  Create short: python video_processor.py short <video> <start> <end>")
        sys.exit(1)
    
    processor = VideoProcessor()
    action = sys.argv[1]
    
    if action == "logo" and len(sys.argv) >= 4:
        result = processor.add_logo(sys.argv[2], sys.argv[3])
    elif action == "clip" and len(sys.argv) >= 5:
        result = processor.extract_clip(sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
    elif action == "short" and len(sys.argv) >= 5:
        result = processor.create_short(sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
    else:
        print("Invalid arguments")
        sys.exit(1)
    
    if result["success"]:
        print(f"✅ Output: {result['output_path']}")
    else:
        print(f"❌ Failed: {result['error']}")
