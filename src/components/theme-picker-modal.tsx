'use client'

import { useEffect, useState } from 'react'
import { getThemes, selectTheme } from '@/lib/api/themes'
import { getMascots, selectMascot } from '@/lib/api/mascots'
import { cn } from '@/lib/utils/format'

interface Props {
  open: boolean
  onClose: () => void
  onApply?: () => void
}

export default function ThemePickerModal({ open, onClose, onApply }: Props) {
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [tab, setTab] = useState<'theme' | 'mascot'>('theme')

  // Data
  const [themes, setThemes] = useState<any[]>([])
  const [mascots, setMascots] = useState<any[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)
  const [selectedMascotId, setSelectedMascotId] = useState<string | null>(null)

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

  async function handleSelectTheme(themeId: string, canUse: boolean, palette: any) {
    if (!canUse || applying) return
    setApplying(true)

    // OPTIMISTIC UI: Apply CSS variables instantly
    if (palette?.primary) {
      document.documentElement.style.setProperty('--theme-primary', palette.primary)
    }
    if (palette?.accent) {
      document.documentElement.style.setProperty('--theme-accent', palette.accent)
    }
    if (palette?.gradient && palette.gradient.length === 3) {
      document.documentElement.style.setProperty('--theme-gradient-1', palette.gradient[0])
      document.documentElement.style.setProperty('--theme-gradient-2', palette.gradient[1])
      document.documentElement.style.setProperty('--theme-gradient-3', palette.gradient[2])
    }

    setSelectedThemeId(themeId)

    try {
      const result = await selectTheme(themeId, isPremium)
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

  async function handleSelectMascot(mascotId: string, canUse: boolean) {
    if (!canUse || applying) return
    setApplying(true)
    setSelectedMascotId(mascotId)

    try {
      const result = await selectMascot(mascotId)
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

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-pink-950/40 backdrop-blur-[5px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-pop">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide drop-shadow">🎨 Personalisasi</h3>
            <p className="text-[11px] text-white/90 font-semibold mt-0.5">Pilih tema & maskot favoritmu</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-pink-200/60 shrink-0">
          <button
            onClick={() => setTab('theme')}
            className={cn(
              'flex-1 py-2.5 text-xs font-bold transition',
              tab === 'theme' ? 'bg-pink-100 text-pink-950 border-b-2 border-pink-500' : 'text-pink-700/60 hover:bg-pink-50'
            )}
          >
            🎨 Tema Warna
          </button>
          <button
            onClick={() => setTab('mascot')}
            className={cn(
              'flex-1 py-2.5 text-xs font-bold transition',
              tab === 'mascot' ? 'bg-pink-100 text-pink-950 border-b-2 border-pink-500' : 'text-pink-700/60 hover:bg-pink-50'
            )}
          >
            🐾 Maskot
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto px-4 py-3 flex-1">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mb-2"></div>
              <p className="text-xs text-pink-800/60 font-medium">Memuat data...</p>
            </div>
          ) : (
            <>
              {/* THEME GRID */}
              {tab === 'theme' && (
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((theme) => {
                    const palette = typeof theme.palette === 'string' ? JSON.parse(theme.palette) : theme.palette
                    const isSelected = theme.id === selectedThemeId
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleSelectTheme(theme.id, theme.can_use, palette)}
                        disabled={!theme.can_use || applying}
                        className={cn(
                          'relative p-3 rounded-2xl border-2 transition text-left',
                          isSelected
                            ? 'border-pink-500 ring-2 ring-pink-200'
                            : theme.can_use
                            ? 'border-pink-200 hover:border-pink-400'
                            : 'border-gray-200 opacity-70 cursor-not-allowed'
                        )}
                        style={{
                          background: palette?.gradient
                            ? `linear-gradient(135deg, ${palette.gradient[0]}, ${palette.gradient[2]})`
                            : '#f3f4f6',
                        }}
                      >
                        {!theme.can_use && (
                          <span className="absolute top-1 right-1 text-[10px] bg-black/50 text-white rounded-full px-1.5 py-0.5">🔒</span>
                        )}
                        {isSelected && (
                          <span className="absolute top-1 left-1 text-[10px] bg-white text-pink-600 rounded-full px-1.5 py-0.5 font-bold">✓</span>
                        )}
                        <div className="text-3xl mb-1">{theme.emoji}</div>
                        <p className="text-xs font-bold text-white drop-shadow">{theme.name}</p>
                        <p className="text-[9px] text-white/80 mt-0.5">{theme.is_premium ? '⭐ Premium' : 'Free'}</p>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* MASCOT GRID */}
              {tab === 'mascot' && (
                <div className="grid grid-cols-2 gap-3">
                  {mascots.map((mascot) => {
                    const isSelected = mascot.id === selectedMascotId
                    // Don't render restricted mascots that user can't access (hide elephant for non-Elsa)
                    if (!mascot.can_use && mascot.locked_reason === 'MASCOT_RESTRICTED') return null
                    return (
                      <button
                        key={mascot.id}
                        onClick={() => handleSelectMascot(mascot.id, mascot.can_use)}
                        disabled={!mascot.can_use || applying}
                        className={cn(
                          'relative p-3 rounded-2xl border-2 transition text-left',
                          isSelected
                            ? 'border-pink-500 ring-2 ring-pink-200 bg-white/80'
                            : mascot.can_use
                            ? 'border-pink-200 hover:border-pink-400 bg-white/60'
                            : 'border-gray-200 opacity-70 cursor-not-allowed bg-white/40'
                        )}
                      >
                        {!mascot.can_use && (
                          <span className="absolute top-1 right-1 text-[10px] bg-black/50 text-white rounded-full px-1.5 py-0.5">🔒</span>
                        )}
                        {isSelected && (
                          <span className="absolute top-1 left-1 text-[10px] bg-pink-500 text-white rounded-full px-1.5 py-0.5 font-bold">✓</span>
                        )}
                        <div className="text-4xl mb-1 text-center">{mascot.emoji}</div>
                        <p className="text-xs font-bold text-pink-950 text-center">{mascot.name}</p>
                        <p className="text-[9px] text-pink-700/60 text-center mt-0.5">{mascot.is_premium ? '⭐ Premium' : 'Free'}</p>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Upgrade hint */}
              {(themes.some(t => !t.can_use) || mascots.some(m => !m.can_use && m.locked_reason !== 'MASCOT_RESTRICTED')) && (
                <p className="mt-4 text-center text-[10px] text-pink-700/60 italic">
                  💡 Beberapa tema/maskot terkunci. Upgrade ke Premium untuk buka semua.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-pink-200/60 bg-white/40 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-white/90 text-pink-950 font-semibold py-2.5 px-4 rounded-xl border border-pink-200/80 shadow-sm transition text-sm hover:bg-white"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  )
}
