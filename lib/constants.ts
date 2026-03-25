import { Video, Stats, Settings, ActivityItem } from './types'

export const mockVideos: Video[] = [
  {
    id: '1',
    title: 'How to Build a React App in 2025',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=300&fit=crop',
    source: 'YouTube',
    duration: '12:45',
    status: 'pending',
    createdAt: new Date('2025-03-20'),
    platform: 'youtube',
  },
  {
    id: '2',
    title: 'Web Development Best Practices',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
    source: 'YouTube',
    duration: '15:30',
    status: 'approved',
    createdAt: new Date('2025-03-19'),
    platform: 'youtube',
  },
  {
    id: '3',
    title: 'Getting Started with Next.js 16',
    thumbnail: 'https://images.unsplash.com/photo-1517694712152-3f2e0ade3dba?w=400&h=300&fit=crop',
    source: 'YouTube',
    duration: '18:20',
    status: 'ready',
    createdAt: new Date('2025-03-18'),
    platform: 'youtube',
  },
  {
    id: '4',
    title: 'TypeScript Tips and Tricks',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
    source: 'Podcast',
    duration: '9:15',
    status: 'posted',
    createdAt: new Date('2025-03-17'),
    postedAt: new Date('2025-03-17'),
    views: 2456,
    url: 'https://youtube.com/watch?v=example1',
    platform: 'youtube',
  },
  {
    id: '5',
    title: 'Database Design Fundamentals',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=300&fit=crop',
    source: 'YouTube',
    duration: '14:00',
    status: 'posted',
    createdAt: new Date('2025-03-16'),
    postedAt: new Date('2025-03-16'),
    views: 3789,
    url: 'https://youtube.com/watch?v=example2',
    platform: 'youtube',
  },
]

export const mockStats: Stats = {
  pending: 3,
  approved: 2,
  postedToday: 1,
  totalPosted: 24,
}

export const mockSettings: Settings = {
  autoPost: true,
  maxPostsPerDay: 3,
  addLogo: true,
  connectedAccounts: {
    youtube: { connected: true, username: '@BuildWithCode' },
    twitter: { connected: true, username: '@buildwithcode' },
    instagram: { connected: false },
    linkedin: { connected: true, username: 'buildwithcode' },
  },
}

export const mockActivity: ActivityItem[] = [
  {
    id: '1',
    title: 'Video approved and ready to post',
    status: 'approved',
    timestamp: new Date('2025-03-24T14:30:00'),
    platform: 'youtube',
  },
  {
    id: '2',
    title: 'New video queued from YouTube',
    status: 'pending',
    timestamp: new Date('2025-03-24T12:15:00'),
  },
  {
    id: '3',
    title: 'Video posted to all platforms',
    status: 'posted',
    timestamp: new Date('2025-03-24T09:00:00'),
    platform: 'youtube',
  },
  {
    id: '4',
    title: 'Auto-posting enabled',
    status: 'ready',
    timestamp: new Date('2025-03-23T16:45:00'),
  },
  {
    id: '5',
    title: 'Connected Instagram account',
    status: 'posted',
    timestamp: new Date('2025-03-23T11:30:00'),
  },
]
