'use client'

import { useEffect, useState, useRef } from 'react'
import { getThemes, selectTheme } from '@/lib/api/themes'
import { getMascots, selectMascot } from '@/lib/api/mascots'
import { cn } from '@/lib/utils/format'
import UpgradeRequiredModal from '@/components/upgrade-required-modal'

interface Props {
  open: boolean
  onClose: () => void
  onApply?: () => void
}

export default function ThemePickerModal({ open, onClose, onApply }: Props) {
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [tab, setTab] = useState<'theme' | 'mascot'>('theme')

  const [themes, setThemes] = useState<any[]>([])
  const [mascots, setMascots] = useState<any[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)
  const [selectedMascotId, setSelectedMascotId] = useState<string | null>(null)

  // Preview mode state
  const [previewActive, setPreviewActive] = useState(false)
  const [previewTheme, setPreviewTheme] = useState<any>(null)
  const [previewTimeLeft, setPreviewTimeLeft] = useState(60)
  const [showCta, setShowCta] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeFeatureName, setUpgradeFeatureName] = useState('')
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null)
  const savedPaletteRef = useRef<string | null>(null)
  const savedAccentRef = useRef<string | null>(null)
  const savedGrad1Ref = useRef<string | null>(null)
  const savedGrad2Ref = useRef<string | null>(null)
  const savedGrad3Ref = useRef<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function loadData() {
      setLoading(true)
      try {
        const [themeData, mascotData] = await Promise.all([getThemes(), getMascots()])
        if (cancelled) return

        setThemes(themeData.themes)
        setIsPremium(themeData.isPremium)
        setSelectedThemeId(themeData.selectedThemeId)

        setMascots(mascotData.mascots)
        setSelectedMascotId(mascotData.selectedMascotId)
      } catch (err) {
        console.error('Failed to load:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [open])

  // Cleanup preview timer on close
  useEffect(() => {
    if (!open && previewTimerRef.current) {
      clearTimeout(previewTimerRef.current)
      revertPreview()
    }
  }, [open])

  function applyCssVars(primary: string, accent: string, gradient: string[]) {
    document.documentElement.style.setProperty('--theme-primary', primary)
    document.documentElement.style.setProperty('--theme-accent', accent)
    if (gradient && gradient.length === 3) {
      document.documentElement.style.setProperty('--theme-gradient-1', gradient[0])
      document.documentElement.style.setProperty('--theme-gradient-2', gradient[1])
      document.documentElement.style.setProperty('--theme-gradient-3', gradient[2])
    }
  }

  function startPreview(theme: any) {
    // Save current CSS vars
    const root = document.documentElement
    savedPaletteRef.current = root.style.getPropertyValue('--theme-primary')
    savedAccentRef.current = root.style.getPropertyValue('--theme-accent')
    savedGrad1Ref.current = root.style.getPropertyValue('--theme-gradient-1')
    savedGrad2Ref.current = root.style.getPropertyValue('--theme-gradient-2')
    savedGrad3Ref.current = root.style.getPropertyValue('--theme-gradient-3')

    // Apply preview theme
    const palette = typeof theme.palette === 'string' ? JSON.parse(theme.palette) : theme.palette
    applyCssVars(palette.primary, palette.accent, palette.gradient)

    setPreviewActive(true)
    setPreviewTheme(theme)
    setPreviewTimeLeft(60)
    setShowCta(false)

    // Close modal so user can explore
    onClose()

    // Start countdown
    let timeLeft = 60
    const interval = setInterval(() => {
      timeLeft -= 1
      setPreviewTimeLeft(timeLeft)
      if (timeLeft <= 0) {
        clearInterval(interval)
        setShowCta(true)
      }
    }, 1000)

    previewTimerRef.current = interval as any
  }

  function revertPreview() {
    // Restore saved CSS vars
    const root = document.documentElement
    if (savedPaletteRef.current) root.style.setProperty('--theme-primary', savedPaletteRef.current)
    if (savedAccentRef.current) root.style.setProperty('--theme-accent', savedAccentRef.current)
    if (savedGrad1Ref.current) root.style.setProperty('--theme-gradient-1', savedGrad1Ref.current)
    if (savedGrad2Ref.current) root.style.setProperty('--theme-gradient-2', savedGrad2Ref.current)
    if (savedGrad3Ref.current) root.style.setProperty('--theme-gradient-3', savedGrad3Ref.current)

    setPreviewActive(false)
    setPreviewTheme(null)
    setShowCta(false)
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current)
      previewTimerRef.current = null
    }
  }

  async function handleSelectTheme(theme: any) {
    const palette = typeof theme.palette === 'string' ? JSON.parse(theme.palette) : theme.palette

    // Free user clicking premium → show upgrade CTA modal
    if (theme.is_premium && !isPremium) {
      setUpgradeFeatureName(`Tema ${theme.name}`)
      setShowUpgradeModal(true)
      return
    }

    // Can use → apply directly
    if (applying) return
    setApplying(true)

    // Optimistic UI
    applyCssVars(palette.primary, palette.accent, palette.gradient)
    setSelectedThemeId(theme.id)

    try {
      const result = await selectTheme(theme.id, isPremium)
      if (result.success) {
        onApply?.()
      } else {
        alert(result.error ?? 'Cannot select this theme')
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setApplying(false)
    }
  }

  async function handleSelectMascot(mascot: any) {
    // Free user clicking premium mascot → show upgrade CTA modal
    if (mascot.is_premium && !isPremium && !mascot.is_restricted) {
      setUpgradeFeatureName(`Maskot ${mascot.name}`)
      setShowUpgradeModal(true)
      return
    }

    // Restricted mascot (elephant) — hide entirely, shouldn't be clickable
    if (mascot.is_restricted && !mascot.can_use) return

    if (applying) return
    setApplying(true)
    setSelectedMascotId(mascot.id)

    try {
      const result = await selectMascot(mascot.id, mascot.wallpaper_url)
      if (result.success) {
        onApply?.()
      } else {
        alert(result.error ?? 'Cannot select this mascot')
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setApplying(false)
    }
  }

  if (!open && !previewActive && !showCta && !showUpgradeModal) return null

  // ===== UPGRADE REQUIRED MODAL (Sprint 4B) =====
  if (showUpgradeModal) {
    return (
      <>
        <UpgradeRequiredModal
          open={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false)
            setUpgradeFeatureName('')
          }}
          featureName={upgradeFeatureName}
        />
      </>
    )
  }

  // ===== PREVIEW BANNER =====
  if (previewActive && !showCta) {
    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-pink-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold animate-pop"
        style={{ top: 'max(env(safe-area-inset-top, 0px), 64px)' }}
      >
        <span className="animate-pulse">⭐</span>
        <span>Preview: {previewTheme?.name}</span>
        <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{previewTimeLeft}s</span>
      </div>
    )
  }

  // ===== CTA MODAL AFTER PREVIEW =====
  if (showCta) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-pink-950/60 backdrop-blur-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-xs w-full p-6 text-center animate-pop">
          <div className="text-4xl mb-3">💎</div>
          <h2 className="text-lg font-bold text-pink-950 mb-1">Preview Selesai!</h2>
          <p className="text-xs text-pink-800/70 mb-4 leading-relaxed">
            Kamu baru saja mencoba <b>{previewTheme?.name}</b>.<br />
            Upgrade ke Premium untuk mengaktifkan tema ini dan menikmati semua fitur premium!
          </p>

          {/* Mini preview card */}
          <div className="mb-4 p-3 rounded-2xl border-2 border-pink-200"
            style={{
              background: `linear-gradient(135deg, ${
                previewTheme ? (JSON.parse(previewTheme.palette)?.gradient?.[0] ?? '#f3f4f6') : '#f3f4f6'
              }, ${
                previewTheme ? (JSON.parse(previewTheme.palette)?.gradient?.[2] ?? '#f3f4f6') : '#f3f4f6'
              })`,
            }}
          >
            <div className="text-2xl mb-1">{previewTheme?.emoji}</div>
            <p className="text-xs font-bold text-white drop-shadow">{previewTheme?.name}</p>
          </div>

          <div className="space-y-2">
            <a
              href="https://wa.me/62XXXXXXXXXXX?text=Halo%20Julyo%2C%20saya%20mau%20upgrade%20ke%20Premium%20untuk%20tema%20Budgeting%20App"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition text-sm"
            >
              💬 Chat Admin — Upgrade Sekarang
            </a>
            <button
              onClick={revertPreview}
              className="w-full bg-pink-100 hover:bg-pink-200 text-pink-700 font-semibold py-2.5 px-4 rounded-xl transition text-sm"
            >
              Mungkin nanti
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!open) return null

  // Group themes
  const freeThemes = themes.filter(t => !t.is_premium)
  const premiumThemes = themes.filter(t => t.is_premium)

  // Group mascots
  const freeMascots = mascots.filter(m => !m.is_premium && !m.is_restricted)
  const premiumMascots = mascots.filter(m => m.is_premium || (m.is_restricted && m.can_use))
  const restrictedMascots = mascots.filter(m => m.is_restricted && !m.can_use)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/50 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="premium-modal-border w-full max-w-md animate-pop">
      <div className="bg-white/80 backdrop-blur-xl rounded-[calc(1.5rem-2px)] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 shrink-0 rounded-t-3xl">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide drop-shadow">🎨 Personalisasi</h3>
            <p className="text-[11px] text-white/90 font-semibold mt-0.5">Pilih tema & maskot favoritmu</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-pink-200/60 shrink-0">
          <button onClick={() => setTab('theme')}
            className={cn('flex-1 py-2.5 text-xs font-bold transition',
              tab === 'theme' ? 'bg-pink-100 text-pink-950 border-b-2 border-pink-500' : 'text-pink-700/60 hover:bg-pink-50'
            )}
          >
            🎨 Tema Warna
          </button>
          <button onClick={() => setTab('mascot')}
            className={cn('flex-1 py-2.5 text-xs font-bold transition',
              tab === 'mascot' ? 'bg-pink-100 text-pink-950 border-b-2 border-pink-500' : 'text-pink-700/60 hover:bg-pink-50'
            )}
          >
            🐾 Maskot
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-4 py-4 flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mb-2"></div>
              <p className="text-xs text-pink-800/60 font-medium">Memuat data...</p>
            </div>
          ) : (
            <>
              {/* ===== THEME TAB ===== */}
              {tab === 'theme' && (
                <div className="space-y-4">
                  {/* FREE Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">FREE</span>
                      <div className="flex-1 h-px bg-emerald-200/60"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {freeThemes.map((theme) => {
                        const palette = typeof theme.palette === 'string' ? JSON.parse(theme.palette) : theme.palette
                        const isSelected = theme.id === selectedThemeId
                        return (
                          <button key={theme.id}
                            onClick={() => handleSelectTheme(theme)}
                            className={cn(
                              'relative p-3 rounded-2xl border-2 transition-all text-left hover:scale-[1.03]',
                              isSelected ? 'border-pink-500 ring-2 ring-pink-200 shadow-md' : 'border-pink-200/60 hover:border-pink-400'
                            )}
                            style={{
                              background: `linear-gradient(135deg, ${palette?.gradient?.[0] ?? '#f3f4f6'}, ${palette?.gradient?.[2] ?? '#f3f4f6'})`,
                            }}
                          >
                            {isSelected && (
                              <span className="absolute top-1 left-1 text-[10px] bg-white text-pink-600 rounded-full px-1.5 py-0.5 font-bold">✓</span>
                            )}
                            <div className="text-3xl mb-1">{theme.emoji}</div>
                            <p className="text-xs font-bold text-white drop-shadow">{theme.name}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* PREMIUM Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-1 rounded-full shimmer-badge">⭐ PREMIUM</span>
                      <div className="flex-1 h-px bg-amber-200/60"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {premiumThemes.map((theme) => {
                        const palette = typeof theme.palette === 'string' ? JSON.parse(theme.palette) : theme.palette
                        const isSelected = theme.id === selectedThemeId
                        return (
                          <button key={theme.id}
                            onClick={() => handleSelectTheme(theme)}
                            className={cn(
                              'relative p-3 rounded-2xl border-2 transition-all text-left hover:scale-[1.03]',
                              isSelected ? 'border-pink-500 ring-2 ring-pink-200 shadow-md' : 'border-amber-200/60 hover:border-amber-400'
                            )}
                            style={{
                              background: `linear-gradient(135deg, ${palette?.gradient?.[0] ?? '#f3f4f6'}, ${palette?.gradient?.[2] ?? '#f3f4f6'})`,
                            }}
                          >
                            {!isPremium && !isSelected && (
                              <span className="absolute top-1 right-1 text-[8px] bg-black/40 text-white rounded-full px-1.5 py-0.5 font-bold backdrop-blur-sm">⭐</span>
                            )}
                            {isSelected && (
                              <span className="absolute top-1 left-1 text-[10px] bg-white text-pink-600 rounded-full px-1.5 py-0.5 font-bold">✓</span>
                            )}
                            <div className="text-3xl mb-1">{theme.emoji}</div>
                            <p className="text-xs font-bold text-white drop-shadow">{theme.name}</p>
                            {!isPremium && (
                              <p className="text-[8px] text-white/70 mt-0.5">{isSelected ? 'Aktif' : 'Klik untuk preview'}</p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {!isPremium && (
                    <p className="text-center text-[10px] text-pink-700/50 italic">
                      💡 Klik tema premium untuk preview 60 detik
                    </p>
                  )}
                </div>
              )}

              {/* ===== MASCOT TAB ===== */}
              {tab === 'mascot' && (
                <div className="space-y-4">
                  {/* FREE Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">FREE</span>
                      <div className="flex-1 h-px bg-emerald-200/60"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {freeMascots.map((mascot) => {
                        const isSelected = mascot.id === selectedMascotId
                        return (
                          <button key={mascot.id}
                            onClick={() => handleSelectMascot(mascot)}
                            className={cn(
                              'relative p-3 rounded-2xl border-2 transition-all text-left hover:scale-[1.03]',
                              isSelected ? 'border-pink-500 ring-2 ring-pink-200 bg-white/80 shadow-md' : 'border-pink-200/60 hover:border-pink-400 bg-white/60'
                            )}
                          >
                            {isSelected && (
                              <span className="absolute top-1 left-1 text-[10px] bg-pink-500 text-white rounded-full px-1.5 py-0.5 font-bold">✓</span>
                            )}
                            {mascot.icon_url ? (
                              <img src={mascot.icon_url} alt={mascot.name} className="w-10 h-10 mb-1 mx-auto" />
                            ) : (
                              <div className="text-4xl mb-1 text-center">{mascot.emoji}</div>
                            )}
                            <p className="text-xs font-bold text-pink-950 text-center">{mascot.name}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* PREMIUM Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-1 rounded-full">⭐ PREMIUM</span>
                      <div className="flex-1 h-px bg-amber-200/60"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {premiumMascots.map((mascot) => {
                        const isSelected = mascot.id === selectedMascotId
                        return (
                          <button key={mascot.id}
                            onClick={() => handleSelectMascot(mascot)}
                            className={cn(
                              'relative p-3 rounded-2xl border-2 transition-all text-left hover:scale-[1.03]',
                              isSelected ? 'border-pink-500 ring-2 ring-pink-200 bg-white/80 shadow-md' : 'border-amber-200/60 hover:border-amber-400 bg-white/60'
                            )}
                          >
                            {!isPremium && !isSelected && !mascot.is_restricted && (
                              <span className="absolute top-1 right-1 text-[8px] bg-black/40 text-white rounded-full px-1.5 py-0.5 font-bold backdrop-blur-sm">⭐</span>
                            )}
                            {isSelected && (
                              <span className="absolute top-1 left-1 text-[10px] bg-pink-500 text-white rounded-full px-1.5 py-0.5 font-bold">✓</span>
                            )}
                            {mascot.icon_url ? (
                              <img src={mascot.icon_url} alt={mascot.name} className="w-10 h-10 mb-1 mx-auto" />
                            ) : (
                              <div className="text-4xl mb-1 text-center">{mascot.emoji}</div>
                            )}
                            <p className="text-xs font-bold text-pink-950 text-center">{mascot.name}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-pink-200/60 bg-white/40 shrink-0">
          <button onClick={onClose}
            className="w-full bg-white/90 text-pink-950 font-semibold py-2.5 px-4 rounded-xl border border-pink-200/80 shadow-sm transition text-sm hover:bg-white"
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Inline shimmer CSS */}
      <style>{`
        .shimmer-badge {
          background: linear-gradient(90deg, #fef3c7, #fbbf24, #fef3c7);
          background-size: 200% auto;
          animation: shimmer 2s linear infinite;
        }
        @keyframes shimmer {
          to { background-position: 200% center; }
        }
      `}</style>
    </div>
      </div>
  )
}
