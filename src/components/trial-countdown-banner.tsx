'use client'

import { useEffect, useState } from 'react'
import { useTier } from '@/lib/hooks/use-tier'
import { PRICING } from '@/lib/constants/tiers'

/**
 * TrialCountdownBanner — "🎁 Premium Trial: 2 days 14 hours remaining"
 *
 * Shows when user is in 'trial' tier.
 * Pink gradient banner at top of dashboard.
 * Auto-refreshes every minute.
 */
export default function TrialCountdownBanner() {
  const { tier, subscriptionInfo, refresh } = useTier()
  const [remainingMs, setRemainingMs] = useState<number>(0)

  // Calculate remaining time
  useEffect(() => {
    if (tier !== 'trial' || !subscriptionInfo?.trial_started_at) {
      setRemainingMs(0)
      return
    }

    const trialDays = subscriptionInfo?.trial_days_remaining ?? PRICING.trial_days
    const trialLengthMs = PRICING.trial_days * 24 * 60 * 60 * 1000
    const startTime = new Date(subscriptionInfo.trial_started_at).getTime()
    const endTime = startTime + trialLengthMs

    function updateRemaining() {
      const now = Date.now()
      const remaining = Math.max(0, endTime - now)
      setRemainingMs(remaining)

      // If trial just expired, refresh tier
      if (remaining === 0) {
        refresh()
      }
    }

    updateRemaining()
    const interval = setInterval(updateRemaining, 60_000) // update every minute
    return () => clearInterval(interval)
  }, [tier, subscriptionInfo?.trial_started_at, subscriptionInfo?.trial_days_remaining, refresh])

  // Don't render if not in trial
  if (tier !== 'trial' || remainingMs === 0) return null

  // Calculate days/hours/minutes
  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000))
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))

  // Determine urgency color
  const isUrgent = days === 0 // Less than 1 day left
  const isCritical = remainingMs < 12 * 60 * 60 * 1000 // Less than 12 hours

  const waLink =
    'https://wa.me/62XXXXXXXXXXX?text=Halo%20Julyo%2C%20saya%20mau%20upgrade%20ke%20Premium%20setelah%20trial%20habis'

  return (
    <div
      className={`mx-auto max-w-md px-3 py-2.5 rounded-2xl border shadow-md text-white text-xs font-bold flex items-center justify-between gap-2 ${
        isCritical
          ? 'bg-gradient-to-r from-rose-500 to-red-500 border-rose-300 animate-pulse'
          : isUrgent
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300'
          : 'bg-gradient-to-r from-pink-400 to-rose-400 border-pink-300'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-base shrink-0">🎁</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-extrabold leading-tight">
            Premium Trial: {days > 0 && `${days}d `}{hours}h {minutes}m remaining
          </p>
          <p className="text-[9px] opacity-90 leading-tight mt-0.5">
            {isCritical
              ? '⚠️ Trial hampir habis! Upgrade sekarang!'
              : 'Unlock all features before it ends'}
          </p>
        </div>
      </div>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 bg-white/25 hover:bg-white/40 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold transition"
      >
        Upgrade →
      </a>
    </div>
  )
}
