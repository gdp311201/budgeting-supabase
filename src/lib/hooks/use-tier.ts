/**
 * useTier — React hook buat fetch current user's tier + feature access
 *
 * Usage:
 *   const { tier, isPremium, isReadOnly, canAccess, refresh } = useTier()
 *
 * @path src/lib/hooks/use-tier.ts
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSubscriptionInfo, type SubscriptionInfo } from '@/lib/api/subscription'
import {
  type Tier,
  type FeatureName,
  canAccessFeature as canAccessFeatureUtil,
  isReadOnlyMode as isReadOnlyModeUtil,
  isPremiumOrHigher as isPremiumOrHigherUtil,
} from '@/lib/constants/tiers'

interface UseTierResult {
  /** Loading state (true on initial fetch) */
  loading: boolean
  /** Error message if fetch failed */
  error: string | null
  /** Effective tier (auto-handles trial expiry & overdue subscriptions) */
  tier: Tier | null
  /** Full subscription info from server */
  subscriptionInfo: SubscriptionInfo | null
  /** True if tier is admin/vip/premium/trial */
  isPremium: boolean
  /** True if tier is admin/vip */
  isVip: boolean
  /** True if user is admin */
  isAdmin: boolean
  /** True if in read-only mode (expired/suspended) */
  isReadOnly: boolean
  /** Days until subscription expires (null if no expiry) */
  daysUntilExpiry: number | null
  /** Trial days remaining (null if not in trial) */
  trialDaysRemaining: number | null
  /** Check if user can access a specific feature (client-side quick check) */
  canAccess: (feature: FeatureName) => boolean
  /** Manually refresh tier info (e.g., after upgrade) */
  refresh: () => Promise<void>
}

export function useTier(): UseTierResult {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const info = await getSubscriptionInfo()
      setSubscriptionInfo(info)
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch tier')
      // Don't throw — graceful fallback to null tier
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const tier = subscriptionInfo?.tier ?? null

  return {
    loading,
    error,
    tier,
    subscriptionInfo,
    isPremium: tier ? isPremiumOrHigherUtil(tier) : false,
    isVip: tier === 'admin' || tier === 'vip',
    isAdmin: tier === 'admin',
    isReadOnly: tier ? isReadOnlyModeUtil(tier) : false,
    daysUntilExpiry: subscriptionInfo?.days_until_expiry ?? null,
    trialDaysRemaining: subscriptionInfo?.trial_days_remaining ?? null,
    canAccess: (feature: FeatureName) =>
      tier ? canAccessFeatureUtil(tier, feature) : false,
    refresh,
  }
}
