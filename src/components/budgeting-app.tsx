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
import FiturPremiumPage from '@/components/fitur-premium'
import FeedbackModal from '@/components/feedback-modal'
import SettingsHubModal from '@/components/settings-hub-modal'
import AccountSwitcherModal from '@/components/account-switcher-modal'
import { getShareableUsers, type ShareableUser } from '@/lib/api/subscription'
import TrialCountdownBanner from '@/components/trial-countdown-banner'
import ExpiryCountdownBanner from '@/components/expiry-countdown-banner'
import MaintenanceModal from '@/components/maintenance-modal'
import ReadOnlyOverlay from '@/components/read-only-overlay'
import AnnouncementModal from '@/components/announcement-modal'
import CoupleBudgetingModal from '@/components/couple-budgeting-modal'
import PairingRequestBanner from '@/components/pairing-request-banner'
import WelcomeGreetingModal from '@/components/welcome-greeting-modal'

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

const WA_NUMBER = '6281575859792'
const WA_LINK_DEFAULT = `https://wa.me/${WA_NUMBER}?text=Halo%20Julyo%2C%20saya%20mau%20tanya%20tentang%20Budgeting%20App`
const WA_LINK_FEEDBACK = `https://wa.me/${WA_NUMBER}?text=Halo%20Julyo%2C%20saya%20mau%20kasih%20feedback%20tentang%20Budgeting%20App`

type AppState = 'pin-setup' | 'pin-lock' | 'welcome' | 'dashboard' | 'cara-pakai' | 'fitur-premium' | 'setting'

export default function BudgetingApp({
  user,
  initialProfile,
}: {
  user: User
  initialProfile: Profile | null
}) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [refreshKey, setRefreshKey] = useState(0)

  // ===== Shared access state =====
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [shareableUsers, setShareableUsers] = useState<ShareableUser[]>([])

  // Onboarding check
  const [showOnboarding, setShowOnboarding] = useState(
    () => !initialProfile?.full_name
  )

  // App state flow
  const [appState, setAppState] = useState<AppState>(() => {
    if (typeof window === 'undefined') return 'welcome'
    const pinHash = localStorage.getItem(PIN_STORAGE_KEY)
    if (pinHash) return 'pin-lock'
    return 'pin-setup'
  })

  // ===== Sprint 3A: Consolidated settings modals =====
  const [showSettingsHub, setShowSettingsHub] = useState(false)
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showCoupleBudgeting, setShowCoupleBudgeting] = useState(false)
  const [showWelcomeGreeting, setShowWelcomeGreeting] = useState(false)

  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

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

  // Fetch shareable users
  useEffect(() => {
    if (appState !== 'dashboard' && appState !== 'welcome') return
    let cancelled = false
    async function fetchShareable() {
      try {
        const users = await getShareableUsers()
        if (!cancelled) setShareableUsers(users)
      } catch (err: any) {
        if (!cancelled) {
          if (!err.message?.includes('Premium tier required')) {
            console.warn('Failed to load shareable users:', err.message)
          }
          setShareableUsers([])
        }
      }
    }
    fetchShareable()
    return () => { cancelled = true }
  }, [appState, user.id])

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
    if (palette.gradient && palette.gradient.length > 0) {
      document.documentElement.style.setProperty('--gradient-1', palette.gradient[0])
      document.documentElement.style.setProperty('--gradient-2', palette.gradient[1] ?? palette.gradient[0])
      document.documentElement.style.setProperty('--gradient-3', palette.gradient[2] ?? palette.gradient[0])
    }

    document.documentElement.style.setProperty('--blur-wallpaper', `${glass.blur_wallpaper ?? 0}px`)
    document.documentElement.style.setProperty('--dim-wallpaper', `${glass.dim_wallpaper ?? 0.75}`)
    document.documentElement.style.setProperty('--blur-page', `${glass.blur_page ?? 3}px`)
    document.documentElement.style.setProperty('--blur-nav', `${glass.blur_nav ?? 3}px`)
    document.documentElement.style.setProperty('--blur-mini', `${glass.blur_mini ?? 12}px`)
    document.documentElement.style.setProperty('--blur-card', `${glass.blur_card ?? 1.8}px`)
    document.documentElement.style.setProperty('--blur-input', `${glass.blur_input ?? 8}px`)

    // Sprint 4A Fix: Always update wallpaper CSS variable (even if null → clear)
    // Previously this was conditional on profile.wallpaper_url being truthy,
    // which meant NULL wallpaper_url never cleared the default elephant wallpaper.
    if (profile.wallpaper_url) {
      document.documentElement.style.setProperty('--theme-wallpaper', `url('${profile.wallpaper_url}')`)
    } else {
      // Clear wallpaper — show gradient only (no image)
      document.documentElement.style.setProperty('--theme-wallpaper', 'none')
    }

    document.body.style.background = `linear-gradient(135deg, var(--gradient-1, #8a96a8), var(--gradient-2, #ba9eb1), var(--gradient-3, #e3b9ca))`
  }, [profile])

  // Dynamic favicon (Sprint 1 Fix: Elephant EXCLUSIVE to Elsa)
  useEffect(() => {
    const ELEPHANT_ICON = 'https://qxarqpbwbsxlbectwgba.supabase.co/storage/v1/object/public/mascots/elephant/icon.png'
    const GDP_LOGO = 'https://qxarqpbwbsxlbectwgba.supabase.co/storage/v1/object/public/logo/GDP_logo.png'

    const ELEPHANT_FAVICON_EMAILS = ['elsakristya19@gmail.com']
    const isElephantFaviconUser = ELEPHANT_FAVICON_EMAILS.includes(user.email ?? '')
    const iconUrl = isElephantFaviconUser ? ELEPHANT_ICON : GDP_LOGO
    const appName = profile?.app_name ?? 'Budgeting Master Sync'

    let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement
    if (!favicon) {
      favicon = document.createElement('link')
      favicon.rel = 'icon'
      document.head.appendChild(favicon)
    }
    favicon.href = iconUrl

    let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement
    if (!appleIcon) {
      appleIcon = document.createElement('link')
      appleIcon.rel = 'apple-touch-icon'
      document.head.appendChild(appleIcon)
    }
    appleIcon.href = iconUrl

    const manifest = {
      name: appName,
      short_name: 'Budgeting',
      start_url: '/',
      display: 'standalone',
      background_color: '#d8b0c0',
      theme_color: '#ec4899',
      icons: [
        { src: iconUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: iconUrl, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ]
    }
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
    const manifestUrl = URL.createObjectURL(manifestBlob)
    let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement
    if (!manifestLink) {
      manifestLink = document.createElement('link')
      manifestLink.rel = 'manifest'
      document.head.appendChild(manifestLink)
    }
    manifestLink.href = manifestUrl
  }, [profile?.icon_name, profile?.app_name])

  const mascotEmoji = profile?.icon_name ? (MASCOT_EMOJIS[profile.icon_name] ?? '🐘') : '🐘'
  const [mascotIconUrl, setMascotIconUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!profile?.icon_name) return
    const supabase = createClient()
    supabase
      .from('mascots')
      .select('icon_url')
      .eq('id', profile.icon_name)
      .single()
      .then(({ data }) => {
        if (data?.icon_url) setMascotIconUrl(data.icon_url)
      })
  }, [profile?.icon_name])

  function handleOnboardingComplete(updatedProfile: Profile) {
    setProfile(updatedProfile)
    setShowOnboarding(false)
    // Sprint 13: Show welcome greeting after onboarding (first-time only)
    setShowWelcomeGreeting(true)
  }

  // ===== Settings Hub handler =====
  function handleSettingsHubSelect(option: 'account' | 'couple' | 'theme' | 'setup') {
    setShowSettingsHub(false)
    // Small delay so hub closes before sub-modal opens
    setTimeout(() => {
      if (option === 'account') setShowAccountSwitcher(true)
      else if (option === 'couple') setShowCoupleBudgeting(true)
      else if (option === 'theme') setShowThemePicker(true)
      else if (option === 'setup') setShowSetup(true)
    }, 100)
  }

  // ===== PIN lock screen =====
  if (appState === 'pin-setup' || appState === 'pin-lock') {
    return (
      <PinLockScreen
        mode={appState === 'pin-setup' ? 'setup' : 'lock'}
        onUnlock={() => setAppState('welcome')}
        onSkip={() => setAppState('welcome')}
      />
    )
  }

  // ===== Onboarding modal =====
  if (showOnboarding) {
    return (
      <OnboardingModal
        user={user}
        onComplete={handleOnboardingComplete}
      />
    )
  }

  // ===== Welcome Greeting (first-time) =====
  if (showWelcomeGreeting) {
    return (
      <>
        <WelcomeGreetingModal
          nickname={profile?.full_name}
          onClose={() => setShowWelcomeGreeting(false)}
        />
      </>
    )
  }

  // ===== WELCOME PAGE =====
  if (appState === 'welcome') {
    return (
      <>
        <WelcomePage
          nickname={profile?.full_name}
          onNavigate={(view) => setAppState(view as AppState)}
        />
        <button
          onClick={() => setShowThemePicker(true)}
          className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full bg-white/70 backdrop-blur-md border border-pink-200/60 shadow-lg flex items-center justify-center hover:scale-110 transition"
          style={{ top: 'max(env(safe-area-inset-top, 0px), 16px)' }}
          aria-label="Pilih Tema"
        >
          🎨
        </button>
        <a
          href={WA_LINK_DEFAULT}
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

  // ===== FITUR PREMIUM PAGE =====
  if (appState === 'fitur-premium') {
    return <FiturPremiumPage onBack={() => setAppState('welcome')} />
  }

  // ===== MAIN APP (Dashboard + tabs) =====
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Glassmorphism wallpaper background */}
      <div className="wallpaper-bg" aria-hidden="true" />
      <div className="wallpaper-veil" aria-hidden="true" />

      {/* Header — CLEAN, no Account Switcher or Theme Picker buttons */}
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
        </div>
      </header>

      {/* Floating Settings button (top-right) → opens Settings Hub */}
      <button
        onClick={() => setShowSettingsHub(true)}
        className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full bg-white/70 backdrop-blur-md border border-pink-200/60 shadow-lg flex items-center justify-center hover:scale-110 transition"
        style={{ top: 'max(env(safe-area-inset-top, 0px), 16px)' }}
        aria-label="Settings"
      >
        <svg className="w-5 h-5 text-pink-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Floating Home button (top-left) → Welcome Page */}
      <button
        onClick={() => setAppState('welcome')}
        className="fixed top-4 left-4 z-40 w-10 h-10 rounded-full bg-white/70 backdrop-blur-md border border-pink-200/60 shadow-lg flex items-center justify-center hover:scale-110 transition"
        style={{ top: 'max(env(safe-area-inset-top, 0px), 16px)' }}
        aria-label="Home"
        title="Kembali ke Home"
      >
        🏠
      </button>

      {/* Floating WhatsApp button */}
      <a
        href={WA_LINK_DEFAULT}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 shadow-lg flex items-center justify-center transition hover:scale-110"
        aria-label="Hubungi via WhatsApp"
      >
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Floating Feedback button */}
      <button
        onClick={() => setShowFeedback(true)}
        className="fixed bottom-40 right-4 z-40 w-12 h-12 rounded-full bg-pink-500 hover:bg-pink-600 shadow-lg flex items-center justify-center transition hover:scale-110"
        aria-label="Kirim Feedback"
        title="Kirim Feedback / Saran"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      </button>

      {/* Active account indicator banner */}
      {activeUserId !== null && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 bg-pink-500/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
          📊 Viewing shared data — Read/Write mode
        </div>
      )}

      {/* ===== Pairing Request Banner (Sprint 10) ===== */}
      <div className="px-4 mb-2">
        <PairingRequestBanner onAccept={() => setShowCoupleBudgeting(true)} />
      </div>

      {/* Announcement Modal */}
      <AnnouncementModal />

      {/* Trial Countdown Banner */}
      <div className="px-4 mb-2">
        <TrialCountdownBanner />
      </div>

      {/* Expiry Countdown Banner */}
      <div className="px-4 mb-2">
        <ExpiryCountdownBanner />
      </div>

      {/* Main content */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pb-32 relative z-10">
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <DashboardView
            user={user}
            mascotEmoji={mascotEmoji}
            mascotIconUrl={mascotIconUrl}
            nickname={profile?.full_name}
            targetUserId={activeUserId ?? undefined}
            refreshKey={refreshKey}
          />
        </div>
        <div className={activeTab === 'input' ? 'block' : 'hidden'}>
          <InputView user={user} targetUserId={activeUserId ?? undefined} />
        </div>
        <div className={activeTab === 'mutasi' ? 'block' : 'hidden'}>
          <MutasiView targetUserId={activeUserId ?? undefined} refreshKey={refreshKey} />
        </div>
        <div className={activeTab === 'receipt' ? 'block' : 'hidden'}>
          <ReceiptView targetUserId={activeUserId ?? undefined} refreshKey={refreshKey} />
        </div>
        <div className={activeTab === 'search' ? 'block' : 'hidden'}>
          <SearchView targetUserId={activeUserId ?? undefined} refreshKey={refreshKey} />
        </div>
      </main>

      {/* Floating bottom navigation */}
      <BottomNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* ===== MODALS ===== */}

      {/* Settings Hub Modal — gateway to Account Switcher, Theme Picker, Setup */}
      <SettingsHubModal
        open={showSettingsHub}
        onClose={() => setShowSettingsHub(false)}
        onSelect={handleSettingsHubSelect}
        showAccountSwitcher={shareableUsers.length > 0}
        showCoupleBudgeting={true}
      />

      {/* Account Switcher Modal (sub-modal from Settings Hub) */}
      <AccountSwitcherModal
        open={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
        activeUserId={activeUserId}
        shareableUsers={shareableUsers}
        myEmail={user.email ?? ''}
        myNickname={profile?.full_name ?? null}
        onSwitch={(userId) => {
          setActiveUserId(userId)
          setRefreshKey((k) => k + 1)
        }}
      />

      {/* Couple Budgeting Modal (Sprint 10) */}
      <CoupleBudgetingModal
        open={showCoupleBudgeting}
        onClose={() => setShowCoupleBudgeting(false)}
        onPairingChanged={() => {
          // Refresh shareable users when pairing status changes
          setRefreshKey((k) => k + 1)
        }}
      />

      {/* Theme Picker Modal */}
      <ThemePickerModal
        open={showThemePicker}
        onClose={() => setShowThemePicker(false)}
        onApply={() => setRefreshKey((k) => k + 1)}
      />

      {/* Setup Budget (sub-modal from Settings Hub) */}
      {showSetup && (
        <SetupView
          user={user}
          onClose={() => setShowSetup(false)}
          targetUserId={activeUserId ?? undefined}
        />
      )}

      {/* Feedback modal */}
      <FeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        waLink={WA_LINK_FEEDBACK}
      />

      {/* Maintenance Modal */}
      <MaintenanceModal />

      {/* Read-Only Overlay */}
      <ReadOnlyOverlay />
    </div>
  )
}
