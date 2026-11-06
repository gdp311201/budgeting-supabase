'use client'

import { useEffect, useState } from 'react'
import { useTier } from '@/lib/hooks/use-tier'
import { PRICING } from '@/lib/constants/tiers'

/**
 * ExpiryCountdownBanner — "⏰ Premium expires in 7 days! [Renew Now]"
 *
 * Shows when user's subscription is about to expire:
 *   - H-7 to H-1: amber/yellow banner
 *   - H-1 (last day): red urgent banner
 *
 * Hidden for: admin, vip (no expiry), trial (handled by TrialCountdownBanner),
 * basic (no countdown needed — already basic), expired (handled by ReadOnlyOverlay).
 */
export default function ExpiryCountdownBanner() {
  const { tier, daysUntilExpiry } = useTier()

  // Don't render for tiers without countdown
  if (
    !daysUntilExpiry || // null/undefined = no expiry (admin/vip/basic without expiry)
    daysUntilExpiry < 0 || // already expired
    daysUntilExpiry > 7 || // more than 7 days = don't show yet
    tier === 'admin' ||
    tier === 'vip' ||
    tier === 'trial' ||
    tier === 'expired' ||
    tier === 'suspended'
  ) {
    return null
  }

  const isUrgent = daysUntilExpiry <= 1 // H-1 or H-0
  const isWarning = daysUntilExpiry <= 3 // H-3 to H-2

  const waLink =
    'https://wa.me/62XXXXXXXXXXX?text=Halo%20Julyo%2C%20saya%20mau%20perpanjang%20subscription%20Budgeting%20App'

  let message = ''
  if (daysUntilExpiry === 0) {
    message = '⚠️ Subscription expires TODAY! Renew now to keep access'
  } else if (daysUntilExpiry === 1) {
    message = '⚠️ Subscription expires TOMORROW! Renew now!'
  } else if (daysUntilExpiry === 2) {
    message = `⏰ Subscription expires in 2 days! Renew now`
  } else {
    message = `⏰ Subscription expires in ${daysUntilExpiry} days. Renew now!`
  }

  return (
    <div
      className={`mx-auto max-w-md px-3 py-2.5 rounded-2xl border shadow-md text-white text-xs font-bold flex items-center justify-between gap-2 ${
        isUrgent
          ? 'bg-gradient-to-r from-red-500 to-rose-600 border-red-300 animate-pulse'
          : isWarning
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300'
          : 'bg-gradient-to-r from-blue-400 to-cyan-400 border-blue-300'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-base shrink-0">{isUrgent ? '🚨' : '⏰'}</span>
        <p className="text-[11px] font-extrabold leading-tight flex-1">{message}</p>
      </div>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 bg-white/25 hover:bg-white/40 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold transition"
      >
        Renew →
      </a>
    </div>
  )
}
