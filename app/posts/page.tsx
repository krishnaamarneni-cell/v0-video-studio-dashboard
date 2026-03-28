// app/posts/page.tsx
// Social Posts list page

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Image as ImageIcon,
  Video,
  Type,
  ExternalLink,
  Trash2,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface SocialPost {
  id: string
  content_type: string
  text_content: string
  media_url: string
  template_type: string
  platforms: string[]
  status: string
  scheduled_for: string | null
  created_at: string
  posted_at: string | null
  twitter_post_url: string | null
  instagram_post_url: string | null
  linkedin_post_url: string | null
  error_message: string | null
}

const PLATFORM_ICONS: Record<string, any> = {
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube
}

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  draft: { color: 'bg-gray-100 text-gray-700', icon: Clock },
  pending_approval: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  scheduled: { color: 'bg-blue-100 text-blue-700', icon: Clock },
  posting: { color: 'bg-purple-100 text-purple-700', icon: Loader2 },
  posted: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { color: 'bg-red-100 text-red-700', icon: XCircle }
}

export default function PostsPage() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  
  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/social?status=${filter}`)
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchPosts()
  }, [filter])
  
  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      await fetch(`/api/social?id=${id}`, { method: 'DELETE' })
      setPosts(posts.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }
  
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'image':
      case 'image_text':
        return ImageIcon
      case 'video':
      case 'video_text':
        return Video
      default:
        return Type
    }
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Social Posts</h1>
          <p className="text-muted-foreground">Manage your social media posts</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchPosts} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link href="/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Post
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="posted">Posted</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No posts found</p>
            <Link href="/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Post
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map(post => {
            const ContentIcon = getContentIcon(post.content_type)
            const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft
            const StatusIcon = statusConfig.icon
            
            return (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Media Preview */}
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {post.media_url ? (
                        <img 
                          src={post.media_url} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ContentIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Text Preview */}
                      <p className="text-sm line-clamp-2 mb-2">
                        {post.text_content || 'No text content'}
                      </p>
                      
                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {/* Platforms */}
                        <div className="flex gap-1">
                          {post.platforms?.map(platform => {
                            const Icon = PLATFORM_ICONS[platform]
                            return Icon ? (
                              <Icon key={platform} className="h-4 w-4" />
                            ) : null
                          })}
                        </div>
                        
                        {/* Template */}
                        <Badge variant="outline" className="text-xs">
                          {post.template_type}
                        </Badge>
                        
                        {/* Status */}
                        <Badge className={`text-xs gap-1 ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {post.status}
                        </Badge>
                        
                        {/* Schedule/Date */}
                        <span>
                          {post.scheduled_for 
                            ? `Scheduled: ${new Date(post.scheduled_for).toLocaleString()}`
                            : `Created: ${new Date(post.created_at).toLocaleString()}`
                          }
                        </span>
                      </div>
                      
                      {/* Error Message */}
                      {post.error_message && (
                        <p className="text-xs text-red-500 mt-2">
                          Error: {post.error_message}
                        </p>
                      )}
                      
                      {/* Post Links */}
                      {post.status === 'posted' && (
                        <div className="flex gap-2 mt-2">
                          {post.twitter_post_url && (
                            <a 
                              href={post.twitter_post_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                            >
                              <Twitter className="h-3 w-3" />
                              View on Twitter
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {post.instagram_post_url && (
                            <a 
                              href={post.instagram_post_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-pink-500 hover:underline flex items-center gap-1"
                            >
                              <Instagram className="h-3 w-3" />
                              View on Instagram
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-start gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deletePost(post.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
