/**
 * Tier Gating Components — reusable UI elements for tier-based feature gating
 *
 * Components:
 *   <PremiumLock>      — wrapper that shows lock overlay when user can't access
 *   <UpgradeCTAModal>  — modal "Upgrade Premium" with WhatsApp link
 *   <LockedButton>     — button that's disabled + shows lock icon for basic users
 *
 * @path src/components/tier-gating.tsx
 */
'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/format'
import { useTier } from '@/lib/hooks/use-tier'
import { TIER_INFO, type FeatureName, getUpgradeTarget } from '@/lib/constants/tiers'

// ============================================================
// UpgradeCTAModal — "Upgrade Premium" modal
// ============================================================

interface UpgradeCTAModalProps {
  open: boolean
  onClose: () => void
  feature?: string
  message?: string
}

export function UpgradeCTAModal({ open, onClose, feature, message }: UpgradeCTAModalProps) {
  if (!open) return null

  const defaultMessage = feature
    ? `${feature} adalah fitur Premium. Upgrade sekarang untuk membukanya!`
    : 'Upgrade ke Premium untuk membuka fitur ini!'

  const waLink = 'https://wa.me/62XXXXXXXXXXX?text=Halo%20Julyo%2C%20saya%20mau%20upgrade%20ke%20Premium%20tier'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-pink-950/60 backdrop-blur-md">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-xs w-full p-6 text-center">
        <div className="text-4xl mb-2">⭐</div>
        <h3 className="text-base font-bold text-pink-950 mb-2">Upgrade ke Premium</h3>
        <p className="text-xs text-pink-700/80 mb-4">
          {message ?? defaultMessage}
        </p>

        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-3 mb-4">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-pink-950">Premium</span>
            <span className="text-pink-600">Rp 88.000/tahun</span>
          </div>
          <ul className="text-[10px] text-pink-700/70 mt-2 space-y-0.5 text-left">
            <li>✓ Semua tema & maskot</li>
            <li>✓ Share with Partner (Couple Budgeting)</li>
            <li>✓ Export reports (PNG/PDF)</li>
            <li>✓ Custom wallpaper upload</li>
            <li>✓ Priority WhatsApp support</li>
          </ul>
        </div>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs mb-2 transition shadow-md"
          onClick={onClose}
        >
          💬 Upgrade via WhatsApp
        </a>
        <button
          onClick={onClose}
          className="w-full text-pink-700/60 hover:text-pink-900 text-xs font-medium py-1"
        >
          Nanti saja
        </button>
      </div>
    </div>
  )
}

// ============================================================
// PremiumLock — wrapper that adds lock overlay + click to open CTA
// ============================================================

interface PremiumLockProps {
  feature: FeatureName
  children: React.ReactNode
  className?: string
  /** If true, fully block clicks on children. If false, allow but show lock badge */
  blockClicks?: boolean
}

export function PremiumLock({
  feature,
  children,
  className,
  blockClicks = true,
}: PremiumLockProps) {
  const { canAccess, tier } = useTier()
  const [showCta, setShowCta] = useState(false)

  // If user can access, just render children normally
  if (canAccess(feature)) {
    return <>{children}</>
  }

  // Otherwise, wrap in lockable container
  return (
    <>
      <div
        className={cn('relative', className)}
        onClick={blockClicks ? (e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowCta(true)
        } : undefined}
        style={blockClicks ? { pointerEvents: 'auto', cursor: 'pointer' } : undefined}
      >
        {children}
        {/* Lock overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-[inherit] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 rounded-full px-2 py-1 text-[10px] font-bold text-pink-700 shadow-md flex items-center gap-1">
            <span>🔒</span>
            <span>Premium</span>
          </div>
        </div>
      </div>
      <UpgradeCTAModal
        open={showCta}
        onClose={() => setShowCta(false)}
        feature={feature}
      />
    </>
  )
}

// ============================================================
// LockedButton — button that's disabled + shows lock for basic users
// ============================================================

interface LockedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  feature: FeatureName
  /** Optional: custom message in CTA */
  ctaMessage?: string
}

export function LockedButton({
  feature,
  ctaMessage,
  children,
  onClick,
  disabled,
  className,
  ...rest
}: LockedButtonProps) {
  const { canAccess } = useTier()
  const [showCta, setShowCta] = useState(false)

  const hasAccess = canAccess(feature)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasAccess) {
      e.preventDefault()
      setShowCta(true)
      return
    }
    onClick?.(e)
  }

  return (
    <>
      <button
        {...rest}
        onClick={handleClick}
        disabled={disabled || !hasAccess}
        className={cn(className, !hasAccess && 'opacity-60 cursor-not-allowed')}
      >
        {!hasAccess && <span className="mr-1">🔒</span>}
        {children}
      </button>
      <UpgradeCTAModal
        open={showCta}
        onClose={() => setShowCta(false)}
        feature={feature}
        message={ctaMessage}
      />
    </>
  )
}

// ============================================================
// TierBadge — small badge showing user's tier
// ============================================================

interface TierBadgeProps {
  tier: Tier
  size?: 'sm' | 'md'
  className?: string
}

export function TierBadge({ tier, size = 'sm', className }: TierBadgeProps) {
  const info = TIER_INFO[tier]
  if (!info) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border',
        info.color,
        info.textColor,
        info.borderColor,
        size === 'sm' ? 'text-[9px]' : 'text-xs',
        className
      )}
    >
      {tier === 'admin' && '👑'}
      {tier === 'vip' && '⭐'}
      {tier === 'premium' && '💎'}
      {tier === 'trial' && '🎁'}
      {tier === 'basic' && '👤'}
      {tier === 'expired' && '⚠️'}
      {tier === 'suspended' && '🚫'}
      {info.label}
    </span>
  )
}
