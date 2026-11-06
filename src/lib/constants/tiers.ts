/**
 * TIER CONSTANTS — Feature access matrix for Personal & Couple Budgeting SaaS
 *
 * Tiers (from DB):
 *   admin     → Super admin (Julyo) — full access, no expiry
 *   vip       → VIP (Elsa only) — premium + exclusive mascot, no expiry
 *   premium   → Premium tier (Rp 88K/year) — all features, has expiry
 *   basic     → Basic tier (Rp 50K/year) — limited features, has expiry
 *   trial     → Premium trial (3 days from onboarding) — same as premium
 *   expired   → Subscription expired — read-only mode
 *   suspended → Admin-suspended user — cannot login
 *
 * @path src/lib/constants/tiers.ts
 */

// ============================================================
// Types
// ============================================================

export type Tier = 'admin' | 'vip' | 'premium' | 'basic' | 'trial' | 'expired' | 'suspended'

export type FeatureName =
  | 'themes_all'
  | 'mascots_all'
  | 'mascots_vip'
  | 'custom_categories'
  | 'share_partner'
  | 'export_reports'
  | 'custom_wallpaper'
  | 'cloud_backup'
  | 'priority_support'
  | 'early_access'

// ============================================================
// Pricing (synced with DB system_settings.site_config.pricing)
// ============================================================

export const PRICING = {
  basic_annual: 50_000,    // Rp 50,000 / year
  premium_annual: 88_000,  // Rp 88,000 / year
  trial_days: 3,
} as const

export const CURRENCY_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
})

export function formatPrice(amount: number): string {
  return CURRENCY_FORMATTER.format(amount)
}

// ============================================================
// Tier metadata (display)
// ============================================================

export interface TierInfo {
  value: Tier
  label: string
  shortLabel: string
  color: string       // tailwind color class for badges
  textColor: string
  borderColor: string
  price?: number      // annual price
  description: string
  isPaid: boolean
  hasExpiry: boolean
}

export const TIER_INFO: Record<Tier, TierInfo> = {
  admin: {
    value: 'admin',
    label: 'Admin',
    shortLabel: 'ADM',
    color: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    description: 'Super admin & owner',
    isPaid: false,
    hasExpiry: false,
  },
  vip: {
    value: 'vip',
    label: 'VIP',
    shortLabel: 'VIP',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    description: 'VIP member — exclusive mascot',
    isPaid: false,
    hasExpiry: false,
  },
  premium: {
    value: 'premium',
    label: 'Premium',
    shortLabel: 'PRO',
    color: 'bg-pink-100',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-300',
    price: PRICING.premium_annual,
    description: 'All features unlocked',
    isPaid: true,
    hasExpiry: true,
  },
  trial: {
    value: 'trial',
    label: 'Premium Trial',
    shortLabel: 'TRY',
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    description: `${PRICING.trial_days}-day Premium trial`,
    isPaid: false,
    hasExpiry: true,
  },
  basic: {
    value: 'basic',
    label: 'Basic',
    shortLabel: 'BAS',
    color: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    price: PRICING.basic_annual,
    description: 'Personal budgeting essentials',
    isPaid: true,
    hasExpiry: true,
  },
  expired: {
    value: 'expired',
    label: 'Expired',
    shortLabel: 'EXP',
    color: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    description: 'Subscription expired (read-only)',
    isPaid: false,
    hasExpiry: false,
  },
  suspended: {
    value: 'suspended',
    label: 'Suspended',
    shortLabel: 'SUS',
    color: 'bg-red-200',
    textColor: 'text-red-800',
    borderColor: 'border-red-400',
    description: 'Account suspended by admin',
    isPaid: false,
    hasExpiry: false,
  },
}

// ============================================================
// Feature access matrix (client-side quick check)
// Note: Server-side check via check_feature_access() RPC is more authoritative
// ============================================================

export type FeatureTier = 'basic' | 'premium' | 'vip'

// Tier required for each feature
export const FEATURE_TIER_REQUIRED: Record<FeatureName, FeatureTier> = {
  themes_all: 'premium',
  mascots_all: 'premium',
  mascots_vip: 'vip',
  share_partner: 'premium',
  export_reports: 'premium',
  custom_wallpaper: 'premium',
  cloud_backup: 'premium',
  priority_support: 'premium',
  early_access: 'premium',
  custom_categories: 'basic', // basic = max 5, premium = unlimited
}

// Max custom categories per tier
export const MAX_CUSTOM_CATEGORIES: Partial<Record<Tier, number>> = {
  admin: Infinity,
  vip: Infinity,
  premium: Infinity,
  trial: Infinity,
  basic: 5,
  expired: 0,
  suspended: 0,
}

// ============================================================
// Helper functions
// ============================================================

/**
 * Check if user can access a feature (client-side quick check).
 * For authoritative check, use check_feature_access() RPC.
 */
export function canAccessFeature(tier: Tier, feature: FeatureName): boolean {
  // Admin & VIP get everything
  if (tier === 'admin' || tier === 'vip') return true

  // Trial = same as premium
  if (tier === 'trial') {
    const required = FEATURE_TIER_REQUIRED[feature]
    return required === 'basic' || required === 'premium'
  }

  if (tier === 'premium') {
    const required = FEATURE_TIER_REQUIRED[feature]
    return required === 'basic' || required === 'premium'
  }

  if (tier === 'basic') {
    return FEATURE_TIER_REQUIRED[feature] === 'basic'
  }

  // expired, suspended
  return false
}

/**
 * Check if user can use shared access (couple budgeting).
 * Eligible: admin, vip, premium, trial
 */
export function canUseSharedAccess(tier: Tier): boolean {
  return ['admin', 'vip', 'premium', 'trial'].includes(tier)
}

/**
 * Check if user is in read-only mode (expired or suspended)
 */
export function isReadOnlyMode(tier: Tier): boolean {
  return tier === 'expired' || tier === 'suspended'
}

/**
 * Check if user can input/edit/delete transactions.
 * Disabled for: expired, suspended
 */
export function canWriteData(tier: Tier): boolean {
  return !isReadOnlyMode(tier)
}

/**
 * Check if user is admin
 */
export function isAdmin(tier: Tier): boolean {
  return tier === 'admin'
}

/**
 * Check if user is VIP (or admin, who has VIP-like access)
 */
export function isVip(tier: Tier): boolean {
  return tier === 'vip' || tier === 'admin'
}

/**
 * Check if user has premium-tier features (or higher)
 */
export function isPremiumOrHigher(tier: Tier): boolean {
  return ['admin', 'vip', 'premium', 'trial'].includes(tier)
}

/**
 * Get max custom categories allowed for a tier
 */
export function getMaxCustomCategories(tier: Tier): number {
  return MAX_CUSTOM_CATEGORIES[tier] ?? 0
}

/**
 * Get tier info for display
 */
export function getTierInfo(tier: Tier): TierInfo {
  return TIER_INFO[tier]
}

/**
 * Get upgrade target tier from current tier.
 * Returns null if no upgrade available.
 */
export function getUpgradeTarget(tier: Tier): Tier | null {
  if (tier === 'basic') return 'premium'
  if (tier === 'expired') return 'basic' // can re-subscribe to basic, or upgrade to premium
  if (tier === 'trial') return 'premium' // after trial, upgrade to premium
  return null // admin, vip, premium, suspended → no upgrade
}
