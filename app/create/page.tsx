// app/create/page.tsx
// Create Post page for social media content creation

'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Image as ImageIcon,
  Video,
  Type,
  Sparkles,
  Upload,
  Link,
  Calendar,
  Send,
  Loader2,
  X,
  RefreshCw
} from 'lucide-react'

// Platform config
const PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'bg-black' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600' },
]

// Template config
const TEMPLATES = [
  { id: 'professional', name: 'Professional', description: 'Clean corporate style' },
  { id: 'quote_card', name: 'Quote Card', description: 'Text on branded background' },
  { id: 'breaking_news', name: 'Breaking News', description: 'Urgent news style' },
  { id: 'meme', name: 'Meme', description: 'Casual/viral style' },
]

export default function CreatePostPage() {
  // Content state
  const [contentType, setContentType] = useState<'text' | 'image' | 'video'>('text')
  const [textContent, setTextContent] = useState('')
  const [textSource, setTextSource] = useState<'manual' | 'ai'>('manual')
  const [aiTextPrompt, setAiTextPrompt] = useState('')
  
  // Media state
  const [mediaSource, setMediaSource] = useState<'upload' | 'ai' | 'url'>('ai')
  const [mediaUrl, setMediaUrl] = useState('')
  const [aiImagePrompt, setAiImagePrompt] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [generatedImageUrl, setGeneratedImageUrl] = useState('')
  
  // Template & Platform state
  const [template, setTemplate] = useState('professional')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter'])
  
  // Hashtags state
  const [hashtags, setHashtags] = useState<string[]>([])
  const [autoHashtags, setAutoHashtags] = useState(true)
  const [newHashtag, setNewHashtag] = useState('')
  
  // Scheduling state
  const [scheduleType, setScheduleType] = useState<'now' | 'schedule'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  
  // Branding state
  const [includeBranding, setIncludeBranding] = useState(true)
  
  // UI state
  const [isGeneratingText, setIsGeneratingText] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Toggle platform selection
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }
  
  // Generate text with AI
  const generateText = async () => {
    if (!aiTextPrompt.trim()) {
      setError('Please enter a prompt for AI text generation')
      return
    }
    
    setIsGeneratingText(true)
    setError('')
    
    try {
      const response = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          prompt: aiTextPrompt,
          template
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.text) {
        setTextContent(data.text)
        setTextSource('ai')
      } else {
        setError(data.error || 'Failed to generate text')
      }
    } catch (err) {
      setError('Failed to generate text. Please try again.')
    } finally {
      setIsGeneratingText(false)
    }
  }
  
  // Generate image with AI
  const generateImage = async () => {
    const prompt = aiImagePrompt.trim() || textContent.trim()
    if (!prompt) {
      setError('Please enter a prompt or text content for image generation')
      return
    }
    
    setIsGeneratingImage(true)
    setError('')
    
    try {
      const response = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          prompt: aiImagePrompt || textContent,
          template,
          platform: selectedPlatforms[0] || 'twitter'
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl)
        setMediaUrl(data.imageUrl)
        setMediaSource('ai')
      } else {
        setError(data.error || 'Failed to generate image')
      }
    } catch (err) {
      setError('Failed to generate image. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }
  
  // Generate hashtags with AI
  const generateHashtags = async () => {
    if (!textContent.trim()) {
      setError('Please enter text content first to generate hashtags')
      return
    }
    
    setIsGeneratingHashtags(true)
    setError('')
    
    try {
      const response = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hashtags',
          prompt: textContent
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.hashtags) {
        setHashtags(data.hashtags)
      } else {
        setError(data.error || 'Failed to generate hashtags')
      }
    } catch (err) {
      setError('Failed to generate hashtags. Please try again.')
    } finally {
      setIsGeneratingHashtags(false)
    }
  }
  
  // Add manual hashtag
  const addHashtag = () => {
    if (newHashtag.trim() && !hashtags.includes(newHashtag.trim())) {
      setHashtags([...hashtags, newHashtag.trim().replace('#', '')])
      setNewHashtag('')
    }
  }
  
  // Remove hashtag
  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(h => h !== tag))
  }
  
  // Submit post
  const submitPost = async () => {
    if (!textContent.trim() && contentType === 'text') {
      setError('Please enter post content')
      return
    }
    
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    
    try {
      // Build scheduled time if applicable
      let scheduledFor = null
      if (scheduleType === 'schedule' && scheduledDate && scheduledTime) {
        scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      }
      
      const postData = {
        contentType: contentType === 'text' && (mediaUrl || generatedImageUrl) ? 'image_text' : contentType,
        textContent,
        textSource,
        aiTextPrompt: textSource === 'ai' ? aiTextPrompt : null,
        mediaUrl: mediaUrl || generatedImageUrl,
        mediaType: contentType === 'video' ? 'video' : 'image',
        mediaSource,
        videoUrl: contentType === 'video' ? videoUrl : null,
        aiImagePrompt: mediaSource === 'ai' ? aiImagePrompt : null,
        templateType: template,
        includeBranding,
        platforms: selectedPlatforms,
        scheduledFor,
        hashtags,
        autoHashtags,
        postNow: scheduleType === 'now'
      }
      
      const response = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })
      
      const data = await response.json()
      
      if (data.post) {
        setSuccess(scheduleType === 'now' 
          ? 'Post submitted! It will be posted shortly.'
          : `Post scheduled for ${new Date(scheduledFor!).toLocaleString()}`
        )
        // Reset form
        resetForm()
      } else {
        setError(data.error || 'Failed to create post')
      }
    } catch (err) {
      setError('Failed to create post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Reset form
  const resetForm = () => {
    setTextContent('')
    setAiTextPrompt('')
    setMediaUrl('')
    setAiImagePrompt('')
    setVideoUrl('')
    setGeneratedImageUrl('')
    setHashtags([])
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Post</h1>
        <p className="text-muted-foreground">Create and schedule social media content</p>
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}
      
      <div className="grid gap-6">
        {/* Platform Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Platforms</CardTitle>
            <CardDescription>Select where to post</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {PLATFORMS.map(platform => (
                <Button
                  key={platform.id}
                  variant={selectedPlatforms.includes(platform.id) ? 'default' : 'outline'}
                  className={`gap-2 ${selectedPlatforms.includes(platform.id) ? platform.color : ''}`}
                  onClick={() => togglePlatform(platform.id)}
                >
                  <platform.icon className="h-4 w-4" />
                  {platform.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Content Type */}
        <Card>
          <CardHeader>
            <CardTitle>Content Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={contentType} onValueChange={(v) => setContentType(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text" className="gap-2">
                  <Type className="h-4 w-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="image" className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="video" className="gap-2">
                  <Video className="h-4 w-4" />
                  Video
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Style Template</CardTitle>
            <CardDescription>Choose a content style</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TEMPLATES.map(t => (
                <Button
                  key={t.id}
                  variant={template === t.id ? 'default' : 'outline'}
                  className="h-auto flex-col py-4"
                  onClick={() => setTemplate(t.id)}
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Text Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Text Content</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateText}
                disabled={isGeneratingText}
                className="gap-2"
              >
                {isGeneratingText ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate with AI
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Prompt */}
            <div>
              <Label>AI Prompt (optional)</Label>
              <Input
                placeholder="e.g., Write a tip about saving money..."
                value={aiTextPrompt}
                onChange={(e) => setAiTextPrompt(e.target.value)}
              />
            </div>
            
            {/* Text Content */}
            <div>
              <Label>Post Text</Label>
              <Textarea
                placeholder="Write your post content here..."
                value={textContent}
                onChange={(e) => {
                  setTextContent(e.target.value)
                  setTextSource('manual')
                }}
                rows={4}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {textContent.length} / 280 characters (Twitter limit)
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Image/Video Content */}
        {(contentType === 'image' || contentType === 'video') && (
          <Card>
            <CardHeader>
              <CardTitle>
                {contentType === 'image' ? 'Image' : 'Video'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contentType === 'image' && (
                <>
                  {/* Image Source Selection */}
                  <div className="flex gap-2">
                    <Button
                      variant={mediaSource === 'ai' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaSource('ai')}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      AI Generate
                    </Button>
                    <Button
                      variant={mediaSource === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaSource('upload')}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                    <Button
                      variant={mediaSource === 'url' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaSource('url')}
                      className="gap-2"
                    >
                      <Link className="h-4 w-4" />
                      URL
                    </Button>
                  </div>
                  
                  {/* AI Image Generation */}
                  {mediaSource === 'ai' && (
                    <div className="space-y-3">
                      <Input
                        placeholder="Describe the image you want to generate..."
                        value={aiImagePrompt}
                        onChange={(e) => setAiImagePrompt(e.target.value)}
                      />
                      <Button 
                        onClick={generateImage} 
                        disabled={isGeneratingImage}
                        className="gap-2"
                      >
                        {isGeneratingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate Image
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {/* URL Input */}
                  {mediaSource === 'url' && (
                    <Input
                      placeholder="Enter image URL..."
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                    />
                  )}
                  
                  {/* Image Preview */}
                  {(generatedImageUrl || mediaUrl) && (
                    <div className="mt-4">
                      <Label>Preview</Label>
                      <div className="mt-2 relative">
                        <img 
                          src={generatedImageUrl || mediaUrl} 
                          alt="Preview" 
                          className="max-w-full h-auto rounded-lg border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setGeneratedImageUrl('')
                            setMediaUrl('')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {contentType === 'video' && (
                <div>
                  <Label>Video URL (YouTube, etc.)</Label>
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Hashtags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Hashtags</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateHashtags}
                disabled={isGeneratingHashtags}
                className="gap-2"
              >
                {isGeneratingHashtags ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Auto-generate
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hashtag Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add hashtag..."
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
              />
              <Button onClick={addHashtag}>Add</Button>
            </div>
            
            {/* Hashtag List */}
            <div className="flex flex-wrap gap-2">
              {hashtags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  #{tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeHashtag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button
                variant={scheduleType === 'now' ? 'default' : 'outline'}
                onClick={() => setScheduleType('now')}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Post Now
              </Button>
              <Button
                variant={scheduleType === 'schedule' ? 'default' : 'outline'}
                onClick={() => setScheduleType('schedule')}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Schedule
              </Button>
            </div>
            
            {scheduleType === 'schedule' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Include WealthClaude Branding</Label>
                <p className="text-sm text-muted-foreground">
                  Add brand colors and style to generated images
                </p>
              </div>
              <Switch
                checked={includeBranding}
                onCheckedChange={setIncludeBranding}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={resetForm}>
            Clear
          </Button>
          <Button 
            onClick={submitPost} 
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : scheduleType === 'now' ? (
              <>
                <Send className="h-4 w-4" />
                Create & Post
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                Schedule Post
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
