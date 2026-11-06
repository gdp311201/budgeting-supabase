/**
 * API: SUBSCRIPTION — client-side functions for tier & subscription management
 *
 * Wraps Supabase RPC functions:
 *   - get_user_subscription_info() → fetch current user's tier & expiry info
 *   - start_trial() → start 3-day Premium trial (called from onboarding)
 *   - check_feature_access(feature) → check if user can use a feature
 *   - get_shareable_users() → list users I can switch to (for account switcher)
 *
 * @path src/lib/api/subscription.ts
 */
import { createClient } from '@/lib/supabase/client'
import type { Tier, FeatureName } from '@/lib/constants/tiers'

// ============================================================
// Types
// ============================================================

export interface SubscriptionInfo {
  status: 'success' | 'error'
  message?: string
  user_id: string
  email: string
  tier: Tier                          // effective tier (after auto-downgrade)
  stored_tier: Tier                    // stored tier in DB (may differ if expired)
  tier_expires_at: string | null       // ISO timestamp or null (never expires)
  days_until_expiry: number | null     // null if no expiry
  trial_started_at: string | null       // ISO timestamp or null
  trial_days_remaining: number | null   // null if not in trial
  is_admin: boolean
  is_premium: boolean                   // admin/vip/premium/trial
  is_vip: boolean                       // admin/vip
  subscription_note?: string | null
}

export interface FeatureAccessResult {
  allowed: boolean
  feature: FeatureName
  current_tier: Tier
  tier_required: 'basic' | 'premium' | 'vip'
  message?: string
}

export interface ShareableUser {
  user_id: string
  email: string
  full_name: string | null
  tier: Tier
  relation: 'owner' | 'viewer'  // owner = my data shared with them; viewer = their data shared with me
}

export interface GetShareableUsersResult {
  status: 'success' | 'error'
  message?: string
  shareable_users: ShareableUser[]
}

// ============================================================
// API functions
// ============================================================

/**
 * Get current user's subscription info (tier, expiry, trial status).
 * Calls get_user_subscription_info() RPC (defaults to auth.uid()).
 */
export async function getSubscriptionInfo(): Promise<SubscriptionInfo> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_user_subscription_info')
  if (error) throw new Error(error.message)
  return data as SubscriptionInfo
}

/**
 * Start 3-day Premium trial (called from onboarding).
 * User must be 'basic' tier and have trial_started_at = null.
 */
export async function startTrial(): Promise<{
  status: 'success' | 'error'
  message?: string
  trial_started_at?: string
  trial_length_days?: number
  subscription_info?: SubscriptionInfo
}> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('start_trial')
  if (error) throw new Error(error.message)
  return data
}

/**
 * Check if current user can access a feature.
 * Server-side authoritative check.
 */
export async function checkFeatureAccess(feature: FeatureName): Promise<FeatureAccessResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('check_feature_access', {
    p_feature: feature,
  })
  if (error) throw new Error(error.message)
  return data as FeatureAccessResult
}

/**
 * List users I can switch to (for account switcher dropdown).
 * Only works for premium+ users.
 */
export async function getShareableUsers(): Promise<ShareableUser[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_shareable_users')
  if (error) throw new Error(error.message)
  const result = data as GetShareableUsersResult
  if (result.status === 'error') {
    // For non-premium users, return empty array (don't throw — graceful fallback)
    if (result.message?.includes('Premium tier required')) return []
    throw new Error(result.message ?? 'Failed to load shareable users')
  }
  return result.shareable_users ?? []
}

/**
 * Get public system setting (e.g., maintenance_mode, announcement).
 * Public read access (no auth needed).
 */
export async function getSystemSetting(key: 'maintenance_mode' | 'announcement' | 'site_config'): Promise<any> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_system_setting', { p_key: key })
  if (error) throw new Error(error.message)
  return data
}

/**
 * Check if app is in maintenance mode (public read).
 * Returns { enabled, message, started_at, expected_completion_hours, allow_admin_access }
 */
export async function getMaintenanceMode(): Promise<{
  enabled: boolean
  message: string
  started_at: string | null
  expected_completion_hours: number | null
  allow_admin_access: boolean
}> {
  const data = await getSystemSetting('maintenance_mode')
  return data ?? { enabled: false, message: '', started_at: null, expected_completion_hours: null, allow_admin_access: true }
}

/**
 * Get current announcement (public read).
 * Returns { enabled, message, type, dismissible, expires_at }
 */
export async function getAnnouncement(): Promise<{
  enabled: boolean
  message: string
  type: 'info' | 'warning' | 'success'
  dismissible: boolean
  expires_at: string | null
}> {
  const data = await getSystemSetting('announcement')
  return data ?? { enabled: false, message: '', type: 'info', dismissible: true, expires_at: null }
}

/**
 * Get site config (pricing, contact info, trial days).
 */
export async function getSiteConfig(): Promise<{
  app_version: string
  whatsapp_number: string
  contact_email: string
  pricing: { basic_annual: number; premium_annual: number }
  trial_days: number
}> {
  const data = await getSystemSetting('site_config')
  return data ?? {
    app_version: '1.0.0',
    whatsapp_number: '',
    contact_email: '',
    pricing: { basic_annual: 50_000, premium_annual: 88_000 },
    trial_days: 3,
  }
}
