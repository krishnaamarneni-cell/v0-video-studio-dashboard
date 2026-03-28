'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MonitoredAccount {
  id: string;
  username: string;
  enabled: boolean;
  last_checked_at: string | null;
  reels_found: number;
  reels_posted: number;
  auto_post_instagram: boolean;
  auto_post_youtube: boolean;
}

export default function CreatePostPage() {
  // Form state
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [contentType, setContentType] = useState<'image' | 'reel' | 'auto'>('image');
  const [platforms, setPlatforms] = useState({
    instagram: true,
    linkedin: true,
  });
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Reel state - just the URL, no download
  const [reelUrl, setReelUrl] = useState('');

  // UI state
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-Follow Monitor state
  const [accounts, setAccounts] = useState<MonitoredAccount[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // AI generation prompts
  const [textTopic, setTextTopic] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');

  // Fetch monitored accounts on mount
  useEffect(() => {
    if (contentType === 'auto') {
      fetchAccounts();
    }
  }, [contentType]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social/monitor');
      const data = await response.json();
      if (data.accounts) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch monitored accounts' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setMessage({ type: 'error', text: 'Please enter an Instagram username' });
      return;
    }

    setIsAdding(true);
    setMessage(null);

    try {
      const response = await fetch('/api/social/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.replace(/^@/, '').trim() }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: 'Account added successfully!' });
        setNewUsername('');
        await fetchAccounts();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add account' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleAccount = async (id: string, field: 'enabled' | 'auto_post_instagram' | 'auto_post_youtube', value: boolean) => {
    try {
      const response = await fetch('/api/social/monitor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        await fetchAccounts();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update account' });
    }
  };

  const handleRemoveAccount = async (id: string) => {
    try {
      const response = await fetch(`/api/social/monitor?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: 'Account removed' });
        await fetchAccounts();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove account' });
    }
  };

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

  // Generate caption for reel (based on topic/context)
  const handleGenerateCaptionForReel = async () => {
    setIsGeneratingText(true);
    setMessage(null);

    try {
      const response = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reel_caption',
          prompt: textTopic || 'engaging finance reel',
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

  // POST NOW - Different handling for images vs reels
  const handlePostNow = async () => {
    if (!platforms.instagram && !platforms.linkedin) {
      setMessage({ type: 'error', text: 'Please select at least one platform' });
      return;
    }

    const platformList = [];
    if (platforms.instagram) platformList.push('instagram');
    if (platforms.linkedin) platformList.push('linkedin');

    setIsPosting(true);
    setMessage(null);

    try {
      // ============================================
      // REEL: Save to Supabase - Local Python will process
      // ============================================
      if (contentType === 'reel') {
        if (!reelUrl.trim()) {
          setMessage({ type: 'error', text: 'Please enter an Instagram Reel URL' });
          setIsPosting(false);
          return;
        }

        // Validate Instagram URL
        if (!reelUrl.includes('instagram.com/reel') && !reelUrl.includes('instagram.com/p/')) {
          setMessage({ type: 'error', text: 'Please enter a valid Instagram Reel URL' });
          setIsPosting(false);
          return;
        }

        // Save to Supabase - local Python script will pick it up
        const response = await fetch('/api/social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text_content: text || '', // Optional - AI will generate if empty
            source_url: reelUrl,      // Instagram reel URL for local download
            media_url: null,          // Will be filled by local script after upload
            platforms: platformList,
            content_type: 'reel',
            status: 'pending_approval',
          }),
        });

        const data = await response.json();

        if (data.error) {
          setMessage({ type: 'error', text: data.error });
        } else {
          setMessage({
            type: 'success',
            text: '✅ Reel queued! Your local Python script will download, upload to Cloudinary, and post via Make.com.'
          });
          clearForm();
        }
        setIsPosting(false);
        return; // Exit early for reels
      }

      // ============================================
      // IMAGE: Post immediately via Make.com
      // ============================================
      if (!text.trim()) {
        setMessage({ type: 'error', text: 'Please enter post text' });
        setIsPosting(false);
        return;
      }

      // Instagram requires media
      if (platforms.instagram && !imageUrl) {
        setMessage({ type: 'error', text: 'Instagram requires an image.' });
        setIsPosting(false);
        return;
      }

      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformList.length === 2 ? 'both' : platformList[0],
          text: text,
          image_url: imageUrl,
          video_url: null,
          content_type: 'image',
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: '🎉 Posted successfully to ' + platformList.join(' & ') + '!' });
        clearForm();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to post. Please try again.' });
    } finally {
      setIsPosting(false);
    }
  };

  // Schedule for later (saves to Supabase for both image and reel)
  const handleSchedule = async () => {
    if (!platforms.instagram && !platforms.linkedin) {
      setMessage({ type: 'error', text: 'Please select at least one platform' });
      return;
    }

    // Validation based on content type
    if (contentType === 'image') {
      if (!text.trim()) {
        setMessage({ type: 'error', text: 'Please enter post text' });
        return;
      }
      if (platforms.instagram && !imageUrl) {
        setMessage({ type: 'error', text: 'Instagram requires an image.' });
        return;
      }
    } else {
      if (!reelUrl.trim()) {
        setMessage({ type: 'error', text: 'Please enter an Instagram Reel URL' });
        return;
      }
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
          text_content: text || '',
          media_url: contentType === 'image' ? imageUrl : null,
          source_url: contentType === 'reel' ? reelUrl : null,
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
    setTextTopic('');
    setImagePrompt('');
    setReelUrl('');
    setScheduleDate('');
    setScheduleTime('');
    setNewUsername('');
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
            <button
              onClick={() => setContentType('auto')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${contentType === 'auto'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
            >
              🔄 Auto-Follow
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Content Creation */}
          <div className="space-y-6">

            {/* ============================================ */}
            {/* REEL SECTION - Just paste URL, no download */}
            {/* ============================================ */}
            {contentType === 'reel' && (
              <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">🎬 Instagram Reel URL</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Paste the Instagram Reel URL below. Your local Python script will handle the download and posting.
                </p>

                <input
                  type="url"
                  value={reelUrl}
                  onChange={(e) => setReelUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/ABC123..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />

                {reelUrl && reelUrl.includes('instagram.com') && (
                  <div className="mt-3 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                    <p className="text-sm text-green-400">✅ Valid Instagram URL detected</p>
                  </div>
                )}

                {/* How it works info box */}
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <h4 className="text-blue-300 font-medium mb-2">📋 How Reel Posting Works:</h4>
                  <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Paste the Instagram reel URL above</li>
                    <li>Click "Post Now" or "Schedule"</li>
                    <li>Saves to queue (Supabase)</li>
                    <li>Your local <code className="bg-gray-700 px-1 rounded">reel_processor.py</code> picks it up</li>
                    <li>Downloads video with yt-dlp</li>
                    <li>Uploads to Cloudinary</li>
                    <li>Generates caption with AI (if empty)</li>
                    <li>Posts via Make.com → Instagram + LinkedIn</li>
                  </ol>
                </div>
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
                    onClick={contentType === 'reel' ? handleGenerateCaptionForReel : handleGenerateText}
                    disabled={isGeneratingText}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors whitespace-nowrap"
                  >
                    {isGeneratingText ? '⏳...' : '🤖 Generate'}
                  </button>
                </div>
              </div>

              {/* Manual Text Input */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {contentType === 'reel' ? 'Or write caption (optional - AI will generate if empty)' : 'Or write manually'}
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={contentType === 'reel'
                    ? "Leave empty for AI-generated caption, or write your own..."
                    : "Write your post here..."
                  }
                  rows={5}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 resize-none"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-400">
                  <span>{text.length} characters</span>
                  <span>Max: 2,200</span>
                </div>
              </div>
            </div>

            {/* ============================================ */}
            {/* AUTO-FOLLOW SECTION */}
            {/* ============================================ */}
            {contentType === 'auto' && (
              <div className="space-y-6">
                {/* Add Account Section */}
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
                  <h2 className="text-lg font-medium mb-4">➕ Add Account to Monitor</h2>
                  <form onSubmit={handleAddAccount} className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-3 text-gray-400">@</span>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="username"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-8 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isAdding}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors whitespace-nowrap"
                    >
                      {isAdding ? '⏳' : '➕ Add'}
                    </button>
                  </form>
                </div>

                {/* Monitored Accounts List */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-medium mb-4">📊 Monitored Accounts</h2>

                  {isLoading ? (
                    <div className="text-gray-400 text-center py-8">Loading accounts...</div>
                  ) : accounts.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">No accounts monitored yet. Add one above!</div>
                  ) : (
                    <div className="space-y-3">
                      {accounts.map((account) => (
                        <div key={account.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">@{account.username}</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  account.enabled
                                    ? 'bg-green-900/50 text-green-300'
                                    : 'bg-gray-600 text-gray-300'
                                }`}>
                                  {account.enabled ? '✓ Active' : '⊘ Paused'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 space-y-1">
                                <div>Last checked: {account.last_checked_at ? new Date(account.last_checked_at).toLocaleString() : 'Never'}</div>
                                <div>Reels found: {account.reels_found} | Posted: {account.reels_posted}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveAccount(account.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Auto-post toggles */}
                          <div className="space-y-2 border-t border-gray-600 pt-3">
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={account.auto_post_instagram}
                                onChange={(e) => handleToggleAccount(account.id, 'auto_post_instagram', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-600 text-pink-500"
                              />
                              <span>Auto-post to Instagram</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={account.auto_post_youtube}
                                onChange={(e) => handleToggleAccount(account.id, 'auto_post_youtube', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-600 text-red-500"
                              />
                              <span>Auto-post to YouTube</span>
                            </label>
                          </div>

                          {/* Pause/Resume button */}
                          <button
                            onClick={() => handleToggleAccount(account.id, 'enabled', !account.enabled)}
                            className="w-full mt-3 px-3 py-2 text-sm rounded-lg font-medium transition-colors bg-gray-600 hover:bg-gray-500"
                          >
                            {account.enabled ? '⏸ Pause' : '▶ Resume'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* How It Works */}
                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
                  <h3 className="text-blue-300 font-medium mb-3">📋 How Auto-Follow Works:</h3>
                  <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                    <li>Add Instagram accounts to monitor above</li>
                    <li>Your local Python script checks for new reels every hour</li>
                    <li>Downloads new reels automatically</li>
                    <li>Generates AI caption with "Follow @wealthclaude"</li>
                    <li>Posts to Instagram & YouTube (if enabled)</li>
                    <li>Automatically deletes from cloud storage after 24 hours</li>
                  </ol>
                </div>
              </div>
            )}

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">🖼️ Image</h2>

                {/* AUTO-GENERATE FROM TEXT */}
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
                {contentType === 'image' && imageUrl && (
                  <div className="aspect-square max-h-[200px] rounded-lg overflow-hidden mb-3 bg-gray-600">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {contentType === 'reel' && reelUrl && (
                  <div className="aspect-video max-h-[150px] rounded-lg overflow-hidden mb-3 bg-purple-900/30 border border-purple-700 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl">🎬</span>
                      <p className="text-sm text-purple-300 mt-2">Reel Video</p>
                      <p className="text-xs text-gray-400 mt-1">Will be downloaded by local script</p>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-4">
                  {text || (contentType === 'reel' ? 'Caption will be AI-generated...' : 'Your post text will appear here...')}
                </p>
                <div className="flex gap-2 mt-3">
                  {platforms.instagram && (
                    <span className="px-2 py-1 bg-pink-600/30 text-pink-300 rounded text-xs">
                      Instagram {contentType === 'reel' ? 'Reel' : 'Post'}
                    </span>
                  )}
                  {platforms.linkedin && (
                    <span className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded text-xs">
                      LinkedIn {contentType === 'reel' ? 'Video' : 'Post'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePostNow}
                disabled={isPosting || (contentType === 'image' && !text.trim()) || (contentType === 'reel' && !reelUrl.trim())}
                className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                {isPosting ? (
                  <>⏳ {contentType === 'reel' ? 'Queueing...' : 'Posting...'}</>
                ) : (
                  <>🚀 {contentType === 'reel' ? 'Add to Queue' : 'Post Now'}</>
                )}
              </button>

              <button
                onClick={handleSchedule}
                disabled={isScheduling || (contentType === 'image' && !text.trim()) || (contentType === 'reel' && !reelUrl.trim())}
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
              {contentType === 'image' ? (
                <>
                  <p>🚀 <strong>Post Now:</strong> Immediately posts via Make.com</p>
                  <p>📅 <strong>Schedule:</strong> Saves to queue for later posting</p>
                  <p>✨ <strong>Auto-Generate:</strong> Creates image based on your text</p>
                </>
              ) : (
                <>
                  <p>🚀 <strong>Add to Queue:</strong> Saves reel URL to Supabase</p>
                  <p>🐍 <strong>Local Script:</strong> Downloads, uploads, posts automatically</p>
                  <p>🤖 <strong>AI Caption:</strong> Generated if you leave caption empty</p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
