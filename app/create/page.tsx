'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CreatePostPage() {
  // Form state
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [platforms, setPlatforms] = useState({
    instagram: true,
    linkedin: true,
  });
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

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

  // Generate image with AI
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter a prompt for image generation' });
      return;
    }

    setIsGeneratingImage(true);
    setMessage(null);

    try {
      const response = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          prompt: imagePrompt,
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

    // Instagram requires an image
    if (platforms.instagram && !imageUrl.trim()) {
      setMessage({ type: 'error', text: 'Instagram requires an image. Please add an image URL or generate one.' });
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
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: '🎉 Posted successfully to ' + platformList.join(' & ') + '!' });
        // Clear form after successful post
        setText('');
        setImageUrl('');
        setTextTopic('');
        setImagePrompt('');
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

    if (platforms.instagram && !imageUrl.trim()) {
      setMessage({ type: 'error', text: 'Instagram requires an image. Please add an image URL or generate one.' });
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
          media_url: imageUrl || null,
          platforms: platformList,
          status: 'pending_approval',
          content_type: imageUrl ? 'image' : 'text',
          scheduled_for: scheduledFor,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: '📅 Post scheduled successfully!' });
        // Clear form
        setText('');
        setImageUrl('');
        setTextTopic('');
        setImagePrompt('');
        setScheduleDate('');
        setScheduleTime('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to schedule post' });
    } finally {
      setIsScheduling(false);
    }
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
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm">● Make.com Connected</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'
            }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Content Creation */}
          <div className="space-y-6">
            {/* Text Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">📝 Post Text</h2>

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
                    {isGeneratingText ? '⏳ Generating...' : '🤖 Generate'}
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
                  rows={6}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 resize-none"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-400">
                  <span>{text.length} characters</span>
                  <span>Max: 2,200 (Instagram) / 3,000 (LinkedIn)</span>
                </div>
              </div>
            </div>

            {/* Image Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">🖼️ Image</h2>

              {/* AI Image Generation */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Generate with AI</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image (e.g., 'professional finance infographic')"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  />
                  <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors whitespace-nowrap"
                  >
                    {isGeneratingImage ? '⏳ Generating...' : '🎨 Generate'}
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
                        (e.target as HTMLImageElement).style.display = 'none';
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
                    <span className="text-xs text-gray-400">(requires image)</span>
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
                    <span className="text-xs text-gray-400">(image optional)</span>
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
              <p className="text-xs text-gray-400 mt-2">
                Leave empty to post immediately or schedule for later
              </p>
            </div>

            {/* Preview Card */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">👁️ Preview</h2>

              <div className="bg-gray-700 rounded-lg p-4">
                {imageUrl && (
                  <div className="aspect-square max-h-[200px] rounded-lg overflow-hidden mb-3">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {text || 'Your post text will appear here...'}
                </p>
                <div className="flex gap-2 mt-3">
                  {platforms.instagram && (
                    <span className="px-2 py-1 bg-pink-600/30 text-pink-300 rounded text-xs">Instagram</span>
                  )}
                  {platforms.linkedin && (
                    <span className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded text-xs">LinkedIn</span>
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
            <div className="text-sm text-gray-400 space-y-2">
              <p>💡 <strong>Post Now:</strong> Immediately posts to selected platforms via Make.com</p>
              <p>📅 <strong>Schedule:</strong> Saves to queue. Python script will post at scheduled time.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
