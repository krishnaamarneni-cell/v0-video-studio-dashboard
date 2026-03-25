export type StatusType = 'pending' | 'approved' | 'posted' | 'skipped' | 'ready'
export type Platform = 'youtube' | 'twitter' | 'instagram' | 'linkedin'

export interface Video {
  id: string
  title: string
  thumbnail?: string
  source: string
  duration: string
  status: StatusType
  createdAt: Date
  postedAt?: Date
  views?: number
  url?: string
  platform?: Platform
}

export interface Stats {
  pending: number
  approved: number
  postedToday: number
  totalPosted: number
}

export interface Settings {
  autoPost: boolean
  maxPostsPerDay: number
  addLogo: boolean
  connectedAccounts: Record<Platform, { connected: boolean; username?: string }>
}

export interface ActivityItem {
  id: string
  title: string
  status: StatusType
  timestamp: Date
  platform?: Platform
}
