'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, ListTodo, Settings, History } from 'lucide-react'
import { useState, useEffect } from 'react'

function SidebarContent() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const links = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/queue', label: 'Queue', icon: ListTodo },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/history', label: 'History', icon: History },
  ]

  const isActive = (href: string) => {
    // Handle root path specially
    if (href === '/') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed md:hidden z-50 bottom-4 right-4 p-2 bg-accent rounded-lg text-accent-foreground"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed md:relative top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-64'
        }`}
      >
        <div className="p-6 space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-sidebar-foreground">Studio</h1>
            <p className="text-xs text-sidebar-foreground/60">Video Management</p>
          </div>

          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{link.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
          <p>© 2025 Video Studio</p>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed md:hidden inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export function Sidebar() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <aside className="fixed md:relative top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border w-64 hidden md:block" />
    )
  }

  return <SidebarContent />
}
