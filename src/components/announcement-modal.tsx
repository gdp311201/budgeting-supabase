'use client'

import { useEffect, useState } from 'react'
import { getAnnouncement } from '@/lib/api/subscription'
import { cn } from '@/lib/utils/format'

interface AnnouncementConfig {
  enabled: boolean
  message: string
  type: 'info' | 'warning' | 'success'
  dismissible: boolean
  expires_at: string | null
}

const STORAGE_KEY = 'bms_announcement_acknowledged'

/**
 * AnnouncementModal — Full-page modal popup for admin-set announcements
 *
 * Sprint 2B: Replaces the small banner with a center modal popup.
 *
 * Behavior:
 * - Polls /api/admin/announcement (public read) every 5 minutes
 * - When enabled & message not empty: show modal
 * - User MUST click "OK, Mengerti" button to dismiss (cannot click backdrop)
 * - Dismissal saved to localStorage (per message hash)
 * - Re-appears when admin updates the message
 *
 * Used in: budgeting-app.tsx (rendered at root level)
 */
export default function AnnouncementModal() {
  const [config, setConfig] = useState<AnnouncementConfig | null>(null)
  const [acknowledged, setAcknowledged] = useState<string | null>(null)

  // Load acknowledged message from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setAcknowledged(stored)
  }, [])

  // Poll announcement every 5 minutes
  useEffect(() => {
    let cancelled = false

    async function fetchAnnouncement() {
      try {
        const cfg = await getAnnouncement()
        if (!cancelled && cfg) {
          setConfig(cfg)
        }
      } catch (err) {
        console.warn('Failed to fetch announcement:', err)
      }
    }

    fetchAnnouncement()
    const interval = setInterval(fetchAnnouncement, 5 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Don't render if no config, disabled, or no message
  if (!config || !config.enabled || !config.message) return null

  // Don't render if user acknowledged THIS specific message
  if (acknowledged === config.message) return null

  const typeStyles = {
    info: {
      iconBg: 'bg-blue-500/20 border-blue-400/40',
      iconColor: 'text-blue-400',
      button: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
      border: 'border-blue-500/30',
    },
    warning: {
      iconBg: 'bg-amber-500/20 border-amber-400/40',
      iconColor: 'text-amber-400',
      button: 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
      border: 'border-amber-500/30',
    },
    success: {
      iconBg: 'bg-emerald-500/20 border-emerald-400/40',
      iconColor: 'text-emerald-400',
      button: 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
      border: 'border-emerald-500/30',
    },
  }

  const typeIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
  }

  const typeTitles = {
    info: 'Informasi',
    warning: 'Perhatian',
    success: 'Kabar Baik',
  }

  const styles = typeStyles[config.type]

  function handleAcknowledge() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, config!.message)
    }
    setAcknowledged(config!.message)
  }

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      // NOTE: No onClick on backdrop — user MUST click "OK, Mengerti" button
    >
      <div
        className={cn(
          'bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border-2',
          styles.border
        )}
      >
        {/* Header with icon */}
        <div className="px-6 pt-6 pb-3 text-center">
          <div
            className={cn(
              'w-16 h-16 mx-auto mb-3 rounded-2xl border flex items-center justify-center text-3xl',
              styles.iconBg,
              styles.iconColor
            )}
          >
            {typeIcons[config.type]}
          </div>
          <h2 className="text-base font-bold text-pink-950 tracking-wide">
            {typeTitles[config.type]}
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-pink-700/60 font-bold mt-1">
            Pengumuman dari Kami
          </p>
        </div>

        {/* Body — message */}
        <div className="px-6 pb-2">
          <div className="bg-pink-50/70 border border-pink-200/60 rounded-2xl p-4">
            <p className="text-sm text-pink-950 leading-relaxed whitespace-pre-wrap text-center">
              {config.message}
            </p>
          </div>
        </div>

        {/* Footer — OK button (mandatory click) */}
        <div className="px-6 py-4">
          <button
            onClick={handleAcknowledge}
            className={cn(
              'w-full bg-gradient-to-r text-white font-bold py-3 px-4 rounded-xl transition shadow-md',
              styles.button
            )}
          >
            OK, Mengerti
          </button>
          <p className="text-center text-[10px] text-pink-700/50 mt-2 italic">
            Klik tombol di atas untuk lanjut menggunakan aplikasi
          </p>
        </div>
      </div>
    </div>
  )
}
