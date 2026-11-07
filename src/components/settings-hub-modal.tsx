'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/format'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (option: 'account' | 'theme' | 'setup') => void
  /** Hide Account Switcher option if no shareable users (basic tier) */
  showAccountSwitcher: boolean
}

const MENU_OPTIONS = [
  {
    key: 'account' as const,
    icon: '👤',
    title: 'Account Switcher',
    desc: 'Switch ke akun pasangan (Couple Budgeting)',
  },
  {
    key: 'theme' as const,
    icon: '🎨',
    title: 'Theme Picker',
    desc: 'Pilih tema warna & maskot favorit Anda',
  },
  {
    key: 'setup' as const,
    icon: '💰',
    title: 'Setup Budget',
    desc: 'Atur akun bank, kategori & budget bulanan',
  },
]

/**
 * SettingsHubModal — Center popup with 3 settings menu options
 *
 * Sprint 3A Consolidation:
 * - Replaces 3 floating buttons (👤 switcher, 🎨 theme, ⚙️ setup)
 * - Single ⚙️ gear button opens this hub
 * - User selects option → hub closes → corresponding sub-modal opens
 * - Rendered via createPortal to bypass backdrop-filter containing block
 */
export default function SettingsHubModal({
  open,
  onClose,
  onSelect,
  showAccountSwitcher,
}: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!open || !mounted || typeof document === 'undefined') return null

  // Filter menu options based on showAccountSwitcher flag
  const visibleOptions = MENU_OPTIONS.filter(
    (opt) => opt.key !== 'account' || showAccountSwitcher
  )

  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-pink-950/40 backdrop-blur-[5px]"
      onClick={onClose}
    >
      <div
        className="bg-white/95 w-full max-w-xs rounded-3xl p-5 text-center shadow-2xl animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Big icon at top */}
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-pink-100 border border-pink-200">
          ⚙️
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-pink-950 mb-1">Settings</h3>
        <p className="text-[11px] text-pink-700/70 mb-4">
          Pilih menu pengaturan
        </p>

        {/* Menu options */}
        <div className="space-y-2 mb-4">
          {visibleOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => {
                onSelect(option.key)
              }}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl transition flex items-center gap-3 border',
                'bg-white/70 border-pink-200 hover:bg-pink-50 hover:border-pink-300'
              )}
            >
              <span className="text-xl shrink-0">{option.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-pink-950 truncate">
                  {option.title}
                </p>
                <p className="text-[10px] text-pink-700/60 truncate">
                  {option.desc}
                </p>
              </div>
              <span className="text-pink-400 text-sm shrink-0">→</span>
            </button>
          ))}
        </div>

        {/* Tutup button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition"
        >
          Tutup
        </button>
      </div>
    </div>,
    document.body
  )
}
