'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import OnboardingModal from '@/components/onboarding-modal'
import PinLockScreen from '@/components/pin-lock-screen'
import WelcomePage from '@/components/welcome-page'
import CaraPakai from '@/components/cara-pakai'

type Tab = 'input' | 'mutasi' | 'dashboard' | 'receipt' | 'search'
const TABS: Tab[] = ['input', 'mutasi', 'dashboard', 'receipt', 'search']

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

const MASCOT_EMOJIS: Record<string, string> = {
  elephant: '🐘', cat: '🐱', butterfly: '🦋', rabbit: '🐰',
  fox: '🦊', panda: '🐼', owl: '🦉', unicorn: '🦄',
  bear: '🐻', dog: '🐶',
}

const PIN_STORAGE_KEY = 'bms_pin_hash'

type AppState = 'pin-setup' | 'pin-lock' | 'welcome' | 'dashboard' | 'cara-pakai' | 'setting'

export default function BudgetingApp({
  user,
  initialProfile,
}: {
  user: User
  initialProfile: Profile | null
}) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Onboarding check (no full_name = need onboarding)
  const [showOnboarding, setShowOnboarding] = useState(
    () => !initialProfile?.full_name
  )

  // App state flow: PIN → Welcome → Dashboard/CaraPakai/Setting
  const [appState, setAppState] = useState<AppState>(() => {
    if (typeof window === 'undefined') return 'welcome'
    const pinHash = localStorage.getItem(PIN_STORAGE_KEY)
    if (pinHash) return 'pin-lock'
    return 'pin-setup'  // ← FIX: no PIN = go to PIN setup (not welcome)
  })

  // Fetch updated profile when refreshKey changes
  useEffect(() => {
    if (refreshKey === 0) return
    async function fetchProfile() {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
    }
    fetchProfile()
  }, [refreshKey, user.id])

  // Apply theme from profile
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

    if (profile.wallpaper_url) {
      document.documentElement.style.setProperty('--theme-wallpaper', `url('${profile.wallpaper_url}')`)
    }

    if (profile.app_name) {
      document.title = profile.app_name
    }
  }, [profile, refreshKey])

  const mascotEmoji = profile?.icon_name ? (MASCOT_EMOJIS[profile.icon_name] ?? '🐘') : '🐘'

  // Fetch mascot icon_url from mascots table
  const [mascotIconUrl, setMascotIconUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.icon_name) return
    async function fetchMascotIcon() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mascots')
        .select('icon_url')
        .eq('id', profile.icon_name)
        .single()
      if (data?.icon_url) setMascotIconUrl(data.icon_url)
    }
    fetchMascotIcon()
  }, [profile?.icon_name])

  // Main app state (tabs + setup)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [showSetup, setShowSetup] = useState(appState === 'setting')

  // ===== ONBOARDING ACTIVE =====
  if (showOnboarding) {
    return (
      <OnboardingModal
        userId={user.id}
        onComplete={(nickname) => {
          setProfile(prev => prev ? { ...prev, full_name: nickname } : prev)
          setShowOnboarding(false)
          // After onboarding, go to PIN setup
          setAppState('pin-setup')
        }}
      />
    )
  }

  // ===== PIN LOCK / SETUP =====
  if (appState === 'pin-lock' || appState === 'pin-setup') {
    return (
      <PinLockScreen
        mode={appState === 'pin-setup' ? 'setup' : 'lock'}
        onUnlock={() => setAppState('welcome')}
        onSkip={() => setAppState('welcome')}
      />
    )
  }

  // ===== WELCOME PAGE =====
  if (appState === 'welcome') {
    return (
      <>
        <WelcomePage
          nickname={profile?.full_name}
          onNavigate={(view) => setAppState(view)}
        />
        {/* Floating buttons on welcome page */}
        <button
          onClick={() => setShowThemePicker(true)}
          className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full bg-white/70 backdrop-blur-md border border-pink-200/60 shadow-lg flex items-center justify-center hover:scale-110 transition"
          style={{ top: 'max(env(safe-area-inset-top, 0px), 16px)' }}
          aria-label="Pilih Tema"
        >
          🎨
        </button>
        <a
          href="https://wa.me/62XXXXXXXXXXX?text=Halo%20Julyo%2C%20saya%20mau%20tanya%20tentang%20Budgeting%20App"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 shadow-lg flex items-center justify-center transition hover:scale-110"
          aria-label="Hubungi via WhatsApp"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
        <ThemePickerModal
          open={showThemePicker}
          onClose={() => setShowThemePicker(false)}
          onApply={() => setRefreshKey((k) => k + 1)}
        />
      </>
    )
  }

  // ===== CARA PAKAI PAGE =====
  if (appState === 'cara-pakai') {
    return <CaraPakai onBack={() => setAppState('welcome')} />
  }

  // ===== SETTING (direct from welcome page) =====
  if (appState === 'setting') {
    return (
      <SetupView user={user} onClose={() => setAppState('welcome')} />
    )
  }

  // ===== MAIN APP (Dashboard + tabs) =====
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Glassmorphism wallpaper background */}
      <div className="wallpaper-bg" aria-hidden="true" />
      <div className="wallpaper-veil" aria-hidden="true" />

      {/* Header with safe-area-inset-top for iPhone notch */}
      <header
        className="text-center py-3 px-4 relative z-10"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-pink-200/70 shadow-sm">
          {mascotIconUrl ? (
            <img src={mascotIconUrl} alt="Mascot" className="w-5 h-5 object-contain" />
          ) : (
            <span className="text-base">{mascotEmoji}</span>
          )}
          <span className="text-xs font-semibold text-pink-950/80 tracking-wide">
            {profile?.app_name ?? 'Budgeting Master Sync'}
          </span>
          <button
            onClick={() => setShowThemePicker(true)}
            className="ml-1 w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 text-white text-xs font-bold flex items-center justify-center hover:scale-110 transition shadow-sm"
            aria-label="Pilih Tema"
          >
            🎨
          </button>
        </div>
      </header>

      {/* Floating Setting button (top-right) */}
      <button
        onClick={() => setShowSetup(true)}
        className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full bg-white/70 backdrop-blur-md border border-pink-200/60 shadow-lg flex items-center justify-center hover:scale-110 transition"
        style={{ top: 'max(env(safe-area-inset-top, 0px), 16px)' }}
        aria-label="Setting"
      >
        <svg className="w-5 h-5 text-pink-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Floating WhatsApp button */}
      <a
        href="https://wa.me/62XXXXXXXXXXX?text=Halo%20Julyo%2C%20saya%20mau%20tanya%20tentang%20Budgeting%20App"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 shadow-lg flex items-center justify-center transition hover:scale-110"
        aria-label="Hubungi via WhatsApp"
      >
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Main content */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pb-32 relative z-10">
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <DashboardView user={user} mascotEmoji={mascotEmoji} mascotIconUrl={mascotIconUrl} nickname={profile?.full_name} />
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
      </main>

      {/* Floating bottom navigation (5 tabs) */}
      <BottomNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Setup modal */}
      {showSetup && (
        <SetupView user={user} onClose={() => setShowSetup(false)} />
      )}

      {/* Theme picker modal */}
      <ThemePickerModal
        open={showThemePicker}
        onClose={() => setShowThemePicker(false)}
        onApply={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
