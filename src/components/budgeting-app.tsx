'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import BottomNav from '@/components/nav/bottom-nav'
import DashboardView from '@/components/modules/dashboard-view'
import InputView from '@/components/modules/input-view'
import MutasiView from '@/components/modules/mutasi-view'
import ReceiptView from '@/components/modules/receipt-view'
import SearchView from '@/components/modules/search-view'
import SetupView from '@/components/modules/setup-view'
import ThemePickerModal from '@/components/theme-picker-modal'

type Tab = 'input' | 'mutasi' | 'dashboard' | 'receipt' | 'search' | 'setting'
const TABS: Tab[] = ['input', 'mutasi', 'dashboard', 'receipt', 'search', 'setting']

type Profile = Database['public']['Tables']['profiles']['Row']

interface ThemePalette {
  primary?: string
  accent?: string
  gradient?: string[]
}

interface GlassSettings {
  blur_wallpaper?: number
  dim_wallpaper?: number
  blur_page?: number
  blur_nav?: number
  blur_mini?: number
  blur_card?: number
  blur_input?: number
}

export default function BudgetingApp({
  user,
  profile,
}: {
  user: User
  profile: Profile | null
}) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Apply theme from profile on mount + when profile changes
  useEffect(() => {
    if (!profile) return

    const palette = (profile.palette ?? {}) as ThemePalette
    const glass = (profile.glass_settings ?? {}) as GlassSettings

    if (palette.primary) {
      document.documentElement.style.setProperty('--theme-primary', palette.primary)
    }
    if (palette.accent) {
      document.documentElement.style.setProperty('--theme-accent', palette.accent)
    }
    if (palette.gradient && palette.gradient.length === 3) {
      document.documentElement.style.setProperty('--theme-gradient-1', palette.gradient[0])
      document.documentElement.style.setProperty('--theme-gradient-2', palette.gradient[1])
      document.documentElement.style.setProperty('--theme-gradient-3', palette.gradient[2])
    }

    // Glass settings
    if (glass.blur_wallpaper !== undefined) {
      document.documentElement.style.setProperty('--blur-wallpaper', `${glass.blur_wallpaper}px`)
    }
    if (glass.dim_wallpaper !== undefined) {
      document.documentElement.style.setProperty('--dim-wallpaper', String(glass.dim_wallpaper))
    }
    if (glass.blur_page !== undefined) {
      document.documentElement.style.setProperty('--blur-page', `${glass.blur_page}px`)
    }
    if (glass.blur_nav !== undefined) {
      document.documentElement.style.setProperty('--blur-nav', `${glass.blur_nav}px`)
    }
    if (glass.blur_mini !== undefined) {
      document.documentElement.style.setProperty('--blur-mini', `${glass.blur_mini}px`)
    }
    if (glass.blur_card !== undefined) {
      document.documentElement.style.setProperty('--blur-card', `${glass.blur_card}px`)
    }
    if (glass.blur_input !== undefined) {
      document.documentElement.style.setProperty('--blur-input', `${glass.blur_input}px`)
    }

    // Wallpaper
    if (profile.wallpaper_url) {
      document.documentElement.style.setProperty('--theme-wallpaper', `url('${profile.wallpaper_url}')`)
    }

    // App name in document title
    if (profile.app_name) {
      document.title = profile.app_name
    }
  }, [profile, refreshKey])

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Glassmorphism wallpaper background */}
      <div className="wallpaper-bg" aria-hidden="true" />
      <div className="wallpaper-veil" aria-hidden="true" />

      {/* Header */}
      <header className="text-center py-3 px-4 relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-pink-200/70 shadow-sm">
          {/* Mascot emoji (or default) */}
          <span className="text-base">
            {profile?.icon_name === 'elephant' && '🐘'}
            {profile?.icon_name === 'cat' && '🐱'}
            {profile?.icon_name === 'butterfly' && '🦋'}
            {profile?.icon_name === 'rabbit' && '🐰'}
            {profile?.icon_name === 'fox' && '🦊'}
            {profile?.icon_name === 'panda' && '🐼'}
            {profile?.icon_name === 'moon' && '🌙'}
            {profile?.icon_name === 'unicorn' && '🦄'}
            {profile?.icon_name === 'sakura' && '🌸'}
            {profile?.icon_name === 'star' && '⭐'}
            {!profile?.icon_name && '🐘'}
          </span>
          <span className="text-xs font-semibold text-pink-950/80 tracking-wide">
            {profile?.app_name ?? 'Budgeting Master Sync'}
          </span>

          {/* Theme picker button */}
          <button
            onClick={() => setShowThemePicker(true)}
            className="ml-1 w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 text-white text-xs font-bold flex items-center justify-center hover:scale-110 transition shadow-sm"
            aria-label="Pilih Tema"
            title="Personalisasi Tema & Maskot"
          >
            🎨
          </button>
        </div>
      </header>

      {/* Main content — render semua views sekaligus, hide yang nggak aktif */}
      {/* Ini bikin state persist saat pindah tab (component nggak di-unmount) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pb-32 relative z-10">
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <DashboardView user={user} />
        </div>
        <div className={activeTab === 'input' ? 'block' : 'hidden'}>
          <InputView user={user} />
        </div>
        <div className={activeTab === 'mutasi' ? 'block' : 'hidden'}>
          <MutasiView />
        </div>
        <div className={activeTab === 'receipt' ? 'block' : 'hidden'}>
          <ReceiptView />
        </div>
        <div className={activeTab === 'search' ? 'block' : 'hidden'}>
          <SearchView />
        </div>
        <div className={activeTab === 'setting' ? 'block' : 'hidden'}>
          <SetupView user={user} onClose={() => setActiveTab('dashboard')} />
        </div>
      </main>

      {/* Floating bottom navigation (6 tabs including Setting) */}
      <BottomNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Theme picker modal */}
      <ThemePickerModal
        open={showThemePicker}
        onClose={() => setShowThemePicker(false)}
        onApply={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
