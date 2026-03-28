// components/sidebar.tsx
// Simple sidebar without shadcn Sidebar dependency

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  ListVideo, 
  Settings, 
  History,
  PlusCircle,
  Send
} from 'lucide-react'

// Video Studio navigation
const videoStudioItems = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Video Queue', href: '/queue', icon: ListVideo },
  { title: 'History', href: '/history', icon: History },
]

// Social Media navigation
const socialMediaItems = [
  { title: 'Create Post', href: '/create', icon: PlusCircle },
  { title: 'Social Posts', href: '/posts', icon: Send },
]

// Settings
const settingsItems = [
  { title: 'Settings', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full w-64 bg-background border-r">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">WealthClaude</h2>
            <p className="text-xs text-muted-foreground">Content Studio</p>
          </div>
        </Link>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Video Studio Section */}
        <div className="px-3 mb-6">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Video Studio
          </h3>
          <nav className="space-y-1">
            {videoStudioItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Social Media Section */}
        <div className="px-3 mb-6">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Social Media
          </h3>
          <nav className="space-y-1">
            {socialMediaItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* System Section */}
        <div className="px-3">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            System
          </h3>
          <nav className="space-y-1">
            {settingsItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}

export default AppSidebar
