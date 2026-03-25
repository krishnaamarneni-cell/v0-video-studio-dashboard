'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { ConnectedAccountCard } from '@/components/settings/connected-accounts'
import { PostingSettings } from '@/components/settings/posting-settings'
import { LogoUpload } from '@/components/settings/logo-upload'
import { useSettings } from '@/hooks/use-data'
import { Loader2 } from 'lucide-react'

const PLATFORMS = ['youtube', 'twitter', 'instagram', 'linkedin']

export default function SettingsPage() {
  const { settings, isLoading } = useSettings()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2">Configure your video studio preferences</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Connected Accounts</h2>
                <div className="grid gap-4">
                  {PLATFORMS.map((platform) => (
                    <ConnectedAccountCard
                      key={platform}
                      platform={platform as any}
                      connected={settings?.connected_accounts?.[platform]?.connected || false}
                      username={settings?.connected_accounts?.[platform]?.username || ''}
                    />
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Posting Configuration</h2>
                <PostingSettings />
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Brand Assets</h2>
                <LogoUpload />
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
