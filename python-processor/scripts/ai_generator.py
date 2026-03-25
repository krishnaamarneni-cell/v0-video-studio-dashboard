"""
AI Content Generator Module
Uses Groq (Llama 3.3) to generate titles, descriptions, and analyze videos
"""

import os
import json
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import Groq client
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("Groq not installed. Install with: pip install groq")


class AIGenerator:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize AI Generator
        
        Args:
            api_key: Groq API key (or set GROQ_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        
        if GROQ_AVAILABLE and self.api_key:
            self.client = Groq(api_key=self.api_key)
            self.model = "llama-3.3-70b-versatile"
        else:
            self.client = None
            logger.warning("Groq client not initialized. Set GROQ_API_KEY env var.")
    
    def _call_groq(self, prompt: str, max_tokens: int = 1000) -> Optional[str]:
        """Make a call to Groq API"""
        if not self.client:
            logger.error("Groq client not available")
            return None
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a YouTube content expert specializing in finance and global markets. You create engaging, clickable titles and descriptions that drive views while maintaining credibility."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return None
    
    def analyze_transcript(
        self,
        transcript: str,
        video_title: str,
        source: str = "Unknown"
    ) -> Dict[str, Any]:
        """
        Analyze video transcript to find key moments and newsworthiness
        
        Args:
            transcript: Full video transcript
            video_title: Original video title
            source: Source name (White House, Fed, etc.)
            
        Returns:
            Dict with analysis results
        """
        # Truncate transcript if too long (Groq context limits)
        max_chars = 15000
        if len(transcript) > max_chars:
            transcript = transcript[:max_chars] + "... [truncated]"
        
        prompt = f"""Analyze this video transcript from {source}.

VIDEO TITLE: {video_title}

TRANSCRIPT:
{transcript}

Provide your analysis in JSON format:
{{
    "newsworthiness_score": <1-10 score based on market/financial impact>,
    "summary": "<2-3 sentence summary>",
    "key_moments": [
        {{"timestamp_estimate": "<MM:SS>", "text": "<key quote or moment>", "viral_potential": <1-10>}},
        ...
    ],
    "suggested_shorts": [
        {{"start_estimate": "<MM:SS>", "end_estimate": "<MM:SS>", "hook": "<compelling 5-8 word hook>", "why": "<why this would go viral>"}},
        ...
    ],
    "topics": ["<topic1>", "<topic2>", ...],
    "sentiment": "<bullish/bearish/neutral/mixed>",
    "market_impact": "<brief assessment of market implications>"
}}

Focus on moments that would make compelling YouTube Shorts (under 60 seconds) about finance/markets.
Return ONLY the JSON, no other text."""

        response = self._call_groq(prompt, max_tokens=2000)
        
        if not response:
            return {"success": False, "error": "API call failed"}
        
        try:
            # Clean up response (remove markdown if present)
            response = response.strip()
            if response.startswith("```"):
                response = response.split("```")[1]
                if response.startswith("json"):
                    response = response[4:]
            
            data = json.loads(response)
            data["success"] = True
            return data
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return {"success": False, "error": "Failed to parse AI response", "raw": response}
    
    def generate_title(
        self,
        video_title: str,
        description: str,
        source: str,
        content_type: str = "short"  # "short" or "long"
    ) -> Dict[str, Any]:
        """
        Generate an engaging YouTube title
        
        Args:
            video_title: Original video title
            description: Brief description or transcript snippet
            source: Source name
            content_type: "short" for Shorts, "long" for regular videos
            
        Returns:
            Dict with title options
        """
        if content_type == "short":
            prompt = f"""Create 5 compelling YouTube Shorts titles for this content:

SOURCE: {source}
ORIGINAL TITLE: {video_title}
CONTENT: {description[:500]}

Requirements for Shorts titles:
- Maximum 50 characters (shorter is better)
- Use power words that create urgency
- Include emoji strategically (1-2 max)
- Make people NEED to watch
- Focus on the most shocking/important revelation

Return ONLY a JSON array of 5 title strings, nothing else:
["title1", "title2", "title3", "title4", "title5"]"""
        else:
            prompt = f"""Create 5 compelling YouTube video titles for this content:

SOURCE: {source}
ORIGINAL TITLE: {video_title}
CONTENT: {description[:500]}

Requirements:
- Maximum 70 characters
- Searchable and SEO-friendly
- Creates curiosity without being clickbait
- Professional but engaging
- Include relevant keywords

Return ONLY a JSON array of 5 title strings, nothing else:
["title1", "title2", "title3", "title4", "title5"]"""

        response = self._call_groq(prompt, max_tokens=500)
        
        if not response:
            return {"success": False, "error": "API call failed"}
        
        try:
            response = response.strip()
            if response.startswith("```"):
                response = response.split("```")[1]
                if response.startswith("json"):
                    response = response[4:]
            
            titles = json.loads(response)
            return {
                "success": True,
                "titles": titles,
                "recommended": titles[0] if titles else None
            }
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to parse response", "raw": response}
    
    def generate_description(
        self,
        title: str,
        content_summary: str,
        source: str,
        source_url: str,
        footer: str = "Track your portfolio with WealthClaude: https://wealthclaude.com"
    ) -> Dict[str, Any]:
        """
        Generate YouTube video description
        
        Args:
            title: Video title
            content_summary: Brief summary of content
            source: Source name
            source_url: Original source URL
            footer: Text to append at end
            
        Returns:
            Dict with description
        """
        prompt = f"""Create a YouTube video description for:

TITLE: {title}
SOURCE: {source}
CONTENT: {content_summary}

Requirements:
- First 2 lines should hook viewers (this shows in search)
- Include relevant hashtags (3-5)
- Professional but accessible tone
- 150-300 words total
- Include a call to action

Do NOT include any links or URLs in your response.
Return ONLY the description text, no JSON formatting."""

        response = self._call_groq(prompt, max_tokens=500)
        
        if not response:
            return {"success": False, "error": "API call failed"}
        
        # Add source attribution and footer
        full_description = f"""{response.strip()}

📺 Source: {source}
🔗 Original: {source_url}

{footer}"""
        
        return {
            "success": True,
            "description": full_description
        }
    
    def generate_tags(
        self,
        title: str,
        description: str,
        topics: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate relevant YouTube tags
        
        Args:
            title: Video title
            description: Video description
            topics: Optional list of topics
            
        Returns:
            Dict with tags list
        """
        topics_str = ", ".join(topics) if topics else "finance, markets, news"
        
        prompt = f"""Generate YouTube tags for this video:

TITLE: {title}
TOPICS: {topics_str}

Requirements:
- 15-20 tags
- Mix of broad and specific
- Include trending terms
- Focus on searchability

Return ONLY a JSON array of tag strings:
["tag1", "tag2", ...]"""

        response = self._call_groq(prompt, max_tokens=300)
        
        if not response:
            return {"success": False, "error": "API call failed"}
        
        try:
            response = response.strip()
            if response.startswith("```"):
                response = response.split("```")[1]
                if response.startswith("json"):
                    response = response[4:]
            
            tags = json.loads(response)
            return {"success": True, "tags": tags}
        except json.JSONDecodeError:
            # Fallback: extract words that look like tags
            default_tags = [
                "finance", "markets", "investing", "stocks", "economy",
                "federal reserve", "interest rates", "breaking news",
                "market analysis", "financial news", "trading"
            ]
            return {"success": True, "tags": default_tags, "note": "Used fallback tags"}
    
    def generate_hook_text(
        self,
        moment_description: str,
        max_chars: int = 50
    ) -> str:
        """
        Generate short hook text for video overlay
        
        Args:
            moment_description: Description of the moment
            max_chars: Maximum characters
            
        Returns:
            Hook text string
        """
        prompt = f"""Create a SHORT text overlay for a YouTube Short.

MOMENT: {moment_description}

Requirements:
- Maximum {max_chars} characters
- Creates instant curiosity
- All caps works well
- Can use "..." for suspense
- NO hashtags or emojis

Return ONLY the text, nothing else."""

        response = self._call_groq(prompt, max_tokens=50)
        
        if response:
            text = response.strip().strip('"')
            return text[:max_chars]
        
        return "WATCH THIS"  # Fallback


class ThumbnailGenerator:
    """Generate thumbnails using Pillow"""
    
    def __init__(self, template_dir: str = "./templates"):
        self.template_dir = template_dir
        
        # Try to import PIL
        try:
            from PIL import Image, ImageDraw, ImageFont
            self.Image = Image
            self.ImageDraw = ImageDraw
            self.ImageFont = ImageFont
            self.PIL_AVAILABLE = True
        except ImportError:
            self.PIL_AVAILABLE = False
            logger.warning("Pillow not installed. Install with: pip install Pillow")
    
    def create_thumbnail(
        self,
        background_path: str,
        text: str,
        output_path: str,
        text_color: str = "white",
        font_size: int = 72
    ) -> Dict[str, Any]:
        """
        Create a thumbnail with text overlay
        
        Args:
            background_path: Path to background image/frame
            text: Text to overlay
            output_path: Where to save thumbnail
            text_color: Text color
            font_size: Font size
            
        Returns:
            Dict with success status
        """
        if not self.PIL_AVAILABLE:
            return {"success": False, "error": "Pillow not available"}
        
        try:
            # Open background
            img = self.Image.open(background_path)
            
            # Resize to YouTube thumbnail dimensions (1280x720)
            img = img.resize((1280, 720), self.Image.LANCZOS)
            
            # Add semi-transparent overlay for text readability
            overlay = self.Image.new('RGBA', img.size, (0, 0, 0, 128))
            img = self.Image.alpha_composite(img.convert('RGBA'), overlay)
            
            # Add text
            draw = self.ImageDraw.Draw(img)
            
            # Try to load a bold font, fallback to default
            try:
                font = self.ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except:
                font = self.ImageFont.load_default()
            
            # Calculate text position (centered)
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (1280 - text_width) // 2
            y = (720 - text_height) // 2
            
            # Draw text with outline
            outline_color = "black"
            for offset in [(-2, -2), (-2, 2), (2, -2), (2, 2)]:
                draw.text((x + offset[0], y + offset[1]), text, font=font, fill=outline_color)
            
            draw.text((x, y), text, font=font, fill=text_color)
            
            # Save
            img.convert('RGB').save(output_path, 'JPEG', quality=95)
            
            return {"success": True, "output_path": output_path}
            
        except Exception as e:
            logger.error(f"Thumbnail creation error: {e}")
            return {"success": False, "error": str(e)}


# CLI usage
if __name__ == "__main__":
    import sys
    
    generator = AIGenerator()
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  Generate title: python ai_generator.py title '<video_title>' '<description>'")
        print("  Generate description: python ai_generator.py desc '<title>' '<summary>'")
        sys.exit(1)
    
    action = sys.argv[1]
    
    if action == "title" and len(sys.argv) >= 4:
        result = generator.generate_title(sys.argv[2], sys.argv[3], "Test Source")
        print(json.dumps(result, indent=2))
    
    elif action == "desc" and len(sys.argv) >= 4:
        result = generator.generate_description(
            sys.argv[2], sys.argv[3], "Test Source", "https://example.com"
        )
        print(result.get("description", result))
    
    else:
        print("Invalid arguments")
