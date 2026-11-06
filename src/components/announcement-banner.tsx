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

const STORAGE_KEY = 'bms_announcement_dismissed'

/**
 * AnnouncementBanner — displays admin-set announcement banner
 *
 * Behavior:
 * - Polls /api/admin/announcement (public read) every 5 minutes
 * - When enabled: show banner at top of dashboard
 * - If dismissible: user can close (saved to localStorage)
 * - Hidden when: disabled OR (dismissible AND user dismissed THIS message)
 *
 * Used in: budgeting-app.tsx (rendered above trial/expiry banners)
 */
export default function AnnouncementBanner() {
  const [config, setConfig] = useState<AnnouncementConfig | null>(null)
  const [dismissed, setDismissed] = useState<string | null>(null)

  // Load dismissed message from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setDismissed(stored)
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
    const interval = setInterval(fetchAnnouncement, 5 * 60 * 1000) // 5 minutes

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Don't render if no config, disabled, or no message
  if (!config || !config.enabled || !config.message) return null

  // Don't render if user dismissed this specific message
  if (config.dismissible && dismissed === config.message) return null

  const typeStyles = {
    info: 'bg-blue-500/15 border-blue-400/40 text-blue-100',
    warning: 'bg-amber-500/15 border-amber-400/40 text-amber-100',
    success: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100',
  }

  const typeIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
  }

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, config!.message)
    }
    setDismissed(config!.message)
  }

  return (
    <div
      className={cn(
        'mx-auto max-w-md px-3 py-2.5 rounded-2xl border backdrop-blur-md shadow-md flex items-center justify-between gap-2',
        typeStyles[config.type]
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-base shrink-0">{typeIcons[config.type]}</span>
        <p className="text-xs font-semibold leading-tight flex-1">
          {config.message}
        </p>
      </div>
      {config.dismissible && (
        <button
          onClick={handleDismiss}
          className="shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          aria-label="Tutup pengumuman"
        >
          ✕
        </button>
      )}
    </div>
  )
}
