import { Platform } from '@/lib/types'
import { Youtube, Twitter, Instagram, Linkedin } from 'lucide-react'

interface PlatformIconProps {
  platform: Platform
}

export function PlatformIcon({ platform }: PlatformIconProps) {
  const icons = {
    youtube: <Youtube size={16} className="text-red-500" />,
    twitter: <Twitter size={16} className="text-blue-400" />,
    instagram: <Instagram size={16} className="text-pink-500" />,
    linkedin: <Linkedin size={16} className="text-blue-600" />,
  }

  return icons[platform]
}
