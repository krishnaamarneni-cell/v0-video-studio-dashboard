'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CreatePostPage() {
  // Form state
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [contentType, setContentType] = useState<'image' | 'reel'>('image');
  const [platforms, setPlatforms] = useState({
    instagram: true,
    linkedin: true,
  });
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Reel import state
  const [reelUrl, setReelUrl] = useState('');
  const [isDownloadingReel, setIsDownloadingReel] = useState(false);

  // UI state
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // AI generation prompts
  const [textTopic, setTextTopic] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');

  // Generate text with AI
  const handleGenerateText = async () => {
    if (!textTopic.trim()) {
      setMessage({ type: 'error', text: 'Please enter a topic for AI to write about' });
      return;
    }

    setIsGeneratingText(true);
    setMessage(null);

    try {
      const response = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          prompt: textTopic,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setText(data.text);
        setMessage({ type: 'success', text: 'Text generated successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate text' });
    } finally {
      setIsGeneratingText(false);
    }
  };

  // Generate image with custom prompt
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter a prompt for image generation' });
      return;
    }

    await generateImage(imagePrompt);
  };

  // AUTO-GENERATE IMAGE FROM TEXT CONTENT
  const handleAutoGenerateImage = async () => {
    if (!text.trim()) {
      setMessage({ type: 'error', text: 'Please enter post text first. The image will be generated based on your text.' });
      return;
    }

    setIsGeneratingImage(true);
    setMessage(null);

    try {
      // First, generate an image prompt from the text content
      const promptResponse = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image_prompt',
          prompt: text,
        }),
      });

      const promptData = await promptResponse.json();

      if (promptData.error) {
        setMessage({ type: 'error', text: promptData.error });
        setIsGeneratingImage(false);
        return;
      }

      // Set the generated prompt for reference
      setImagePrompt(promptData.image_prompt);

      // Now generate the image using that prompt
      await generateImage(promptData.image_prompt);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to auto-generate image' });
      setIsGeneratingImage(false);
    }
  };

  // Actual image generation function
  const generateImage = async (prompt: string) => {
    setIsGeneratingImage(true);
    setMessage(null);

    try {
      const response = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          prompt: prompt,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setImageUrl(data.image_url);
        setMessage({ type: 'success', text: 'Image generated successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate image' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // DOWNLOAD AND PROCESS INSTAGRAM REEL
  const handleImportReel = async () => {
    if (!reelUrl.trim()) {
      setMessage({ type: 'error', text: 'Please paste an Instagram Reel URL' });
      return;
    }

    // Validate Instagram URL
    if (!reelUrl.includes('instagram.com/reel') && !reelUrl.includes('instagram.com/p/')) {
      setMessage({ type: 'error', text: 'Please enter a valid Instagram Reel URL' });
      return;
    }

    setIsDownloadingReel(true);
    setMessage(null);

    try {
      const response = await fetch('/api/social/import-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: reelUrl,
          generate_caption: true,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setVideoUrl(data.video_url);
        setContentType('reel');

        // If caption was generated, set it
        if (data.caption) {
          setText(data.caption);
        }

        // If thumbnail was extracted, set it as preview
        if (data.thumbnail_url) {
          setImageUrl(data.thumbnail_url);
        }

        setMessage({ type: 'success', text: 'Reel imported successfully! Caption generated.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import reel. Make sure the URL is public.' });
    } finally {
      setIsDownloadingReel(false);
    }
  };

  // Generate caption for video/reel
  const handleGenerateCaptionForReel = async () => {
    if (!videoUrl) {
      setMessage({ type: 'error', text: 'Please import a reel first' });
      return;
    }

    setIsGeneratingText(true);
    setMessage(null);

    try {
      const response = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reel_caption',
          prompt: reelUrl || 'engaging finance reel',
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setText(data.text);
        setMessage({ type: 'success', text: 'Caption generated for reel!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate caption' });
    } finally {
      setIsGeneratingText(false);
    }
  };

  // Post immediately via Make.com
  const handlePostNow = async () => {
    if (!text.trim()) {
      setMessage({ type: 'error', text: 'Please enter post text' });
      return;
    }

    if (!platforms.instagram && !platforms.linkedin) {
      setMessage({ type: 'error', text: 'Please select at least one platform' });
      return;
    }

    // Instagram requires media
    if (platforms.instagram && !imageUrl && !videoUrl) {
      setMessage({ type: 'error', text: 'Instagram requires an image or video.' });
      return;
    }

    setIsPosting(true);
    setMessage(null);

    try {
      const platformList = [];
      if (platforms.instagram) platformList.push('instagram');
      if (platforms.linkedin) platformList.push('linkedin');

      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformList.length === 2 ? 'both' : platformList[0],
          text: text,
          image_url: imageUrl || null,
          video_url: videoUrl || null,
          content_type: contentType,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: '🎉 Posted successfully to ' + platformList.join(' & ') + '!' });
        // Clear form after successful post
        clearForm();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to post. Please try again.' });
    } finally {
      setIsPosting(false);
    }
  };

  // Schedule for later (saves to Supabase)
  const handleSchedule = async () => {
    if (!text.trim()) {
      setMessage({ type: 'error', text: 'Please enter post text' });
      return;
    }

    if (!platforms.instagram && !platforms.linkedin) {
      setMessage({ type: 'error', text: 'Please select at least one platform' });
      return;
    }

    if (platforms.instagram && !imageUrl && !videoUrl) {
      setMessage({ type: 'error', text: 'Instagram requires an image or video.' });
      return;
    }

    setIsScheduling(true);
    setMessage(null);

    try {
      const platformList = [];
      if (platforms.instagram) platformList.push('instagram');
      if (platforms.linkedin) platformList.push('linkedin');

      // Build scheduled_for timestamp
      let scheduledFor = null;
      if (scheduleDate && scheduleTime) {
        scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      const response = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text_content: text,
          media_url: contentType === 'reel' ? videoUrl : imageUrl,
          platforms: platformList,
          status: 'pending_approval',
          content_type: contentType,
          scheduled_for: scheduledFor,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: '📅 Post scheduled successfully!' });
        clearForm();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to schedule post' });
    } finally {
      setIsScheduling(false);
    }
  };

  const clearForm = () => {
    setText('');
    setImageUrl('');
    setVideoUrl('');
    setTextTopic('');
    setImagePrompt('');
    setReelUrl('');
    setScheduleDate('');
    setScheduleTime('');
    setContentType('image');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white">
              ← Back
            </Link>
            <h1 className="text-xl font-semibold">Create Post</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-green-400 text-sm">● Make.com Connected</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'
            }`}>
            {message.text}
          </div>
        )}

        {/* Content Type Selector */}
        <div className="mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setContentType('image')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${contentType === 'image'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
            >
              📸 Image Post
            </button>
            <button
              onClick={() => setContentType('reel')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${contentType === 'reel'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
            >
              🎬 Reel / Video
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Content Creation */}
          <div className="space-y-6">

            {/* Reel Import Section (only show for reel type) */}
            {contentType === 'reel' && (
              <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">🎬 Import Instagram Reel</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Paste an Instagram Reel URL. We'll download it and auto-generate a caption!
                </p>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={reelUrl}
                    onChange={(e) => setReelUrl(e.target.value)}
                    placeholder="https://www.instagram.com/reel/ABC123..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleImportReel}
                    disabled={isDownloadingReel}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors whitespace-nowrap"
                  >
                    {isDownloadingReel ? '⏳ Downloading...' : '📥 Import'}
                  </button>
                </div>

                {videoUrl && (
                  <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                    <p className="text-sm text-green-400">✅ Reel imported successfully!</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{videoUrl}</p>
                  </div>
                )}
              </div>
            )}

            {/* Text Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">📝 Caption / Text</h2>

              {/* AI Text Generation */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Generate with AI</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textTopic}
                    onChange={(e) => setTextTopic(e.target.value)}
                    placeholder="Enter topic (e.g., 'investing tips for beginners')"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  />
                  <button
                    onClick={handleGenerateText}
                    disabled={isGeneratingText}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors whitespace-nowrap"
                  >
                    {isGeneratingText ? '⏳...' : '🤖 Generate'}
                  </button>
                </div>
              </div>

              {/* Manual Text Input */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Or write manually</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write your post here..."
                  rows={5}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 resize-none"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-400">
                  <span>{text.length} characters</span>
                  <span>Max: 2,200</span>
                </div>
              </div>
            </div>

            {/* Image Section (only for image posts) */}
            {contentType === 'image' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">🖼️ Image</h2>

                {/* AUTO-GENERATE FROM TEXT - NEW! */}
                <div className="mb-4 p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                  <label className="block text-sm text-green-400 font-medium mb-2">
                    ✨ Auto-Generate from Text (Recommended)
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    Creates an image based on your post text automatically!
                  </p>
                  <button
                    onClick={handleAutoGenerateImage}
                    disabled={isGeneratingImage || !text.trim()}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                  >
                    {isGeneratingImage ? '⏳ Generating Image from Text...' : '✨ Auto-Generate Image from Text'}
                  </button>
                </div>

                {/* Manual prompt generation */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Or use custom prompt</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the image you want..."
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                    />
                    <button
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors whitespace-nowrap"
                    >
                      {isGeneratingImage ? '⏳...' : '🎨 Generate'}
                    </button>
                  </div>
                </div>

                {/* Manual Image URL */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Or paste image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  />
                </div>

                {/* Image Preview */}
                {imageUrl && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-400 mb-2">Preview</label>
                    <div className="relative aspect-square max-w-[200px] rounded-lg overflow-hidden bg-gray-700">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23374151" width="100" height="100"/><text x="50%" y="50%" fill="%239CA3AF" text-anchor="middle" dy=".3em" font-size="12">Error</text></svg>';
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setImageUrl('')}
                      className="mt-2 text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕ Remove image
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Settings & Actions */}
          <div className="space-y-6">
            {/* Platform Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">📱 Platforms</h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platforms.instagram}
                    onChange={(e) => setPlatforms({ ...platforms, instagram: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-pink-500 focus:ring-pink-500"
                  />
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">📸</span>
                    <span>Instagram</span>
                    <span className="text-xs text-gray-400">
                      ({contentType === 'reel' ? 'Reel' : 'Photo Post'})
                    </span>
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platforms.linkedin}
                    onChange={(e) => setPlatforms({ ...platforms, linkedin: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">💼</span>
                    <span>LinkedIn</span>
                    <span className="text-xs text-gray-400">
                      ({contentType === 'reel' ? 'Video Post' : 'Image Post'})
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Schedule Options */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">📅 Schedule (Optional)</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">👁️ Preview</h2>

              <div className="bg-gray-700 rounded-lg p-4">
                {(imageUrl || videoUrl) && (
                  <div className="aspect-square max-h-[200px] rounded-lg overflow-hidden mb-3 bg-gray-600">
                    {contentType === 'reel' && videoUrl ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">🎬</span>
                        <span className="ml-2 text-sm text-gray-300">Video Ready</span>
                      </div>
                    ) : (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}
                <p className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-4">
                  {text || 'Your post text will appear here...'}
                </p>
                <div className="flex gap-2 mt-3">
                  {platforms.instagram && (
                    <span className="px-2 py-1 bg-pink-600/30 text-pink-300 rounded text-xs">
                      Instagram {contentType === 'reel' ? 'Reel' : 'Post'}
                    </span>
                  )}
                  {platforms.linkedin && (
                    <span className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded text-xs">
                      LinkedIn
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePostNow}
                disabled={isPosting || !text.trim()}
                className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                {isPosting ? (
                  <>⏳ Posting...</>
                ) : (
                  <>🚀 Post Now</>
                )}
              </button>

              <button
                onClick={handleSchedule}
                disabled={isScheduling || !text.trim()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                {isScheduling ? (
                  <>⏳ Scheduling...</>
                ) : (
                  <>📅 Schedule for Later</>
                )}
              </button>
            </div>

            {/* Info */}
            <div className="text-sm text-gray-400 space-y-2 bg-gray-800/50 rounded-lg p-4">
              <p>💡 <strong>Post Now:</strong> Immediately posts via Make.com</p>
              <p>📅 <strong>Schedule:</strong> Saves to queue for later posting</p>
              <p>✨ <strong>Auto-Generate:</strong> Creates image based on your text</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
