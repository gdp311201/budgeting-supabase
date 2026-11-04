'use client'

import { useEffect, useState } from 'react'
import { getThemes, selectTheme, type ThemeWithAccess } from '@/lib/api/themes'
import { getMascots, selectMascot, type MascotWithAccess } from '@/lib/api/mascots'
import { cn } from '@/lib/utils/format'

interface Props {
  open: boolean
  onClose: () => void
  onApply?: () => void  // Callback to refresh app after theme/mascot change
}

export default function ThemePickerModal({ open, onClose, onApply }: Props) {
  const [themes, setThemes] = useState<ThemeWithAccess[]>([])
  const [mascots, setMascots] = useState<MascotWithAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [tab, setTab] = useState<'theme' | 'mascot'>('theme')

  useEffect(() => {
    if (!open) return
    Promise.all([getThemes(), getMascots()])
      .then(([t, m]) => {
        setThemes(t as any)
        setMascots(m)
      })
      .catch((err) => console.error('Failed to load:', err))
      .finally(() => setLoading(false))
  }, [open])

  async function handleSelectTheme(themeId: string) {
    setApplying(true)
    try {
      const result = await selectTheme(themeId)
      if (result.success) {
        // Refresh list to update is_selected
        const updated = await getThemes()
        setThemes(updated as any)
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

  async function handleSelectMascot(mascotId: string) {
    setApplying(true)
    try {
      const result = await selectMascot(mascotId)
      if (result.success) {
        const updated = await getMascots()
        setMascots(updated)
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 glass-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-modal-card w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-pop">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide drop-shadow">
              🎨 Personalisasi
            </h3>
            <p className="text-[11px] text-white/90 font-semibold mt-0.5">
              Pilih tema & maskot favoritmu
            </p>
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
        <div className="flex border-b border-pink-200/60">
          <button
            onClick={() => setTab('theme')}
            className={cn(
              'flex-1 py-2.5 text-xs font-bold transition',
              tab === 'theme'
                ? 'bg-pink-100 text-pink-950 border-b-2 border-pink-500'
                : 'text-pink-700/60 hover:bg-pink-50'
            )}
          >
            🎨 Tema Warna
          </button>
          <button
            onClick={() => setTab('mascot')}
            className={cn(
              'flex-1 py-2.5 text-xs font-bold transition',
              tab === 'mascot'
                ? 'bg-pink-100 text-pink-950 border-b-2 border-pink-500'
                : 'text-pink-700/60 hover:bg-pink-50'
            )}
          >
            🐾 Maskot
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-4 py-3 flex-1">
          {loading && (
            <p className="text-center text-xs text-pink-800/60 py-8">Memuat data...</p>
          )}

          {/* THEME GRID */}
          {tab === 'theme' && !loading && (
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => {
                const palette = theme.palette as { primary: string; accent: string; gradient: string[] }
                const isSelected = (theme as any).is_selected
                return (
                  <button
                    key={theme.id}
                    onClick={() => theme.can_use && handleSelectTheme(theme.id)}
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
                      background: `linear-gradient(135deg, ${palette.gradient[0]}, ${palette.gradient[2]})`,
                    }}
                  >
                    {/* Lock badge */}
                    {!theme.can_use && (
                      <span className="absolute top-1 right-1 text-[10px] bg-black/50 text-white rounded-full px-1.5 py-0.5">
                        🔒
                      </span>
                    )}
                    {/* Selected badge */}
                    {isSelected && (
                      <span className="absolute top-1 left-1 text-[10px] bg-white text-pink-600 rounded-full px-1.5 py-0.5 font-bold">
                        ✓
                      </span>
                    )}

                    <div className="text-3xl mb-1">{theme.emoji}</div>
                    <p className="text-xs font-bold text-white drop-shadow">
                      {theme.name}
                    </p>
                    <p className="text-[9px] text-white/80 mt-0.5">
                      {theme.is_premium ? '⭐ Premium' : 'Free'}
                    </p>
                  </button>
                )
              })}
            </div>
          )}

          {/* MASCOT GRID */}
          {tab === 'mascot' && !loading && (
            <div className="grid grid-cols-2 gap-3">
              {mascots.map((mascot) => {
                const isSelected = mascot.is_selected
                const isHidden = !mascot.can_use && mascot.locked_reason === 'MASCOT_RESTRICTED'
                // Don't render restricted mascots (elephant for non-elsa)
                if (isHidden) return null
                return (
                  <button
                    key={mascot.id}
                    onClick={() => mascot.can_use && handleSelectMascot(mascot.id)}
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
                      <span className="absolute top-1 right-1 text-[10px] bg-black/50 text-white rounded-full px-1.5 py-0.5">
                        🔒
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute top-1 left-1 text-[10px] bg-pink-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                        ✓
                      </span>
                    )}

                    <div className="text-4xl mb-1 text-center">{mascot.emoji}</div>
                    <p className="text-xs font-bold text-pink-950 text-center">
                      {mascot.name}
                    </p>
                    <p className="text-[9px] text-pink-700/60 text-center mt-0.5">
                      {mascot.is_premium ? '⭐ Premium' : 'Free'}
                    </p>
                  </button>
                )
              })}
            </div>
          )}

          {/* Upgrade hint */}
          {tab === 'theme' && themes.some((t) => !t.can_use) && (
            <p className="mt-4 text-center text-[10px] text-pink-700/60 italic">
              💡 Beberapa tema terkunci. Upgrade ke Premium untuk buka semua tema.
            </p>
          )}
          {tab === 'mascot' && mascots.some((m) => !m.can_use) && (
            <p className="mt-4 text-center text-[10px] text-pink-700/60 italic">
              💡 Beberapa maskot eksklusif/premium. Hubungi admin untuk akses.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-pink-200/60 bg-white/40">
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
