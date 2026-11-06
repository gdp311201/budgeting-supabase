/**
 * API: ADMIN — client-side functions for admin panel operations
 *
 * All functions use Supabase RPC functions that have admin verification
 * (security definer + check is_admin = true).
 *
 * Admin = user with profiles.is_admin = true (only growspheredigpro@gmail.com)
 *
 * @path src/lib/api/admin.ts
 */
import { createClient } from '@/lib/supabase/client'
import type { Tier } from '@/lib/constants/tiers'

// ============================================================
// Types
// ============================================================

export interface AdminUser {
  user_id: string
  email: string
  full_name: string | null
  tier: Tier                       // effective tier
  stored_tier: Tier
  tier_expires_at: string | null
  trial_started_at: string | null
  is_admin: boolean
  is_premium: boolean
  is_vip: boolean
  days_until_expiry: number | null
  trial_days_remaining: number | null
  subscription_note: string | null
  transaction_count: number        // count of user's transactions
  account_count: number            // count of user's accounts
  last_sign_in_at: string | null
  created_at: string
}

export interface AdminStats {
  total_users: number
  by_tier: Record<Tier, number>
  premium_conversion_rate: number  // (premium + vip + admin) / total_users * 100
  trial_active: number
  trial_expired: number
  expired_users: number
  suspended_users: number
  recent_signups_7d: number
}

export interface SetTierResult {
  status: 'success' | 'error'
  message?: string
  user_id?: string
  new_tier?: Tier
  tier_expires_at?: string | null
  note?: string | null
  updated_by?: string
}

export interface ExtendSubscriptionResult {
  status: 'success' | 'error'
  message?: string
  user_id?: string
  new_expiry?: string
}

export interface MaintenanceModeConfig {
  enabled: boolean
  message: string
  started_at: string | null
  expected_completion_hours: number | null
  allow_admin_access: boolean
}

// ============================================================
// Admin RPC functions (all require is_admin = true)
// ============================================================

/**
 * Get all registered users (admin panel: User Management section)
 * Returns enriched data: tier, expiry, trial status, counts.
 *
 * Implementation: This is a security definer RPC function we'll need to add.
 * For now, we'll fetch from profiles + auth.users separately.
 */
export async function adminListUsers(): Promise<AdminUser[]> {
  const supabase = createClient()

  // Fetch profiles with computed tier
  const { data: profiles, error } = await supabase.rpc('admin_list_users')
  if (error) throw new Error(error.message)
  return (profiles ?? []) as AdminUser[]
}

/**
 * Get admin stats (total users, conversion rate, etc.)
 */
export async function adminGetStats(): Promise<AdminStats> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('admin_get_stats')
  if (error) throw new Error(error.message)
  return data as AdminStats
}

/**
 * Change a user's tier (manual upgrade after payment verified).
 * Admin-only.
 *
 * @param userId - target user's UUID
 * @param tier - new tier ('admin' | 'vip' | 'premium' | 'basic' | 'trial' | 'expired' | 'suspended')
 * @param days - subscription duration in days (null = no expiry, used for admin/vip)
 * @param note - admin note (audit trail)
 */
export async function adminSetUserTier(
  userId: string,
  tier: Tier,
  days: number | null = null,
  note: string | null = null
): Promise<SetTierResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('admin_set_user_tier', {
    p_user_id: userId,
    p_tier: tier,
    p_days: days,
    p_note: note,
  })
  if (error) throw new Error(error.message)
  return data as SetTierResult
}

/**
 * Extend a user's subscription by N days.
 * Calculates new expiry = max(current_expiry, now) + days.
 */
export async function adminExtendSubscription(
  userId: string,
  days: number
): Promise<ExtendSubscriptionResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('admin_extend_subscription', {
    p_user_id: userId,
    p_days: days,
  })
  if (error) throw new Error(error.message)
  return data as ExtendSubscriptionResult
}

/**
 * Suspend a user (set tier = 'suspended').
 * User can no longer login to app.
 */
export async function adminSuspendUser(userId: string, reason: string): Promise<SetTierResult> {
  return adminSetUserTier(userId, 'suspended', null, `Suspended: ${reason}`)
}

/**
 * Unsuspend a user (set back to 'basic').
 */
export async function adminUnsuspendUser(userId: string): Promise<SetTierResult> {
  return adminSetUserTier(userId, 'basic', null, 'Unsuspended by admin')
}

/**
 * Upgrade user to Premium for 1 year (365 days).
 * Convenience wrapper for adminSetUserTier.
 */
export async function adminUpgradeToPremium(
  userId: string,
  note: string = 'Manual upgrade after payment'
): Promise<SetTierResult> {
  return adminSetUserTier(userId, 'premium', 365, note)
}

/**
 * Downgrade user to Basic for 1 year (365 days).
 */
export async function adminDowngradeToBasic(
  userId: string,
  note: string = 'Manual downgrade'
): Promise<SetTierResult> {
  return adminSetUserTier(userId, 'basic', 365, note)
}

/**
 * Mark user as expired (read-only mode).
 * Used when user doesn't renew in time.
 */
export async function adminMarkExpired(userId: string): Promise<SetTierResult> {
  return adminSetUserTier(userId, 'expired', null, 'Marked expired by admin')
}

// ============================================================
// System settings (maintenance mode, announcement)
// ============================================================

/**
 * Toggle maintenance mode on/off.
 * When ON, non-admin users see maintenance modal and can't access app.
 */
export async function adminSetMaintenanceMode(config: {
  enabled: boolean
  message: string
  expected_completion_hours?: number | null
  allow_admin_access?: boolean
}): Promise<{ status: 'success' | 'error'; message?: string }> {
  const supabase = createClient()

  // First fetch current value to preserve fields we don't want to overwrite
  const { data: current } = await supabase.rpc('get_system_setting', { p_key: 'maintenance_mode' })
  const currentValue = current ?? {}

  const newValue = {
    ...currentValue,
    enabled: config.enabled,
    message: config.message,
    started_at: config.enabled ? (currentValue.started_at ?? new Date().toISOString()) : null,
    expected_completion_hours: config.expected_completion_hours ?? null,
    allow_admin_access: config.allow_admin_access ?? true,
  }

  const { error } = await supabase
    .from('system_settings')
    .update({ value: newValue })
    .eq('key', 'maintenance_mode')

  if (error) throw new Error(error.message)
  return { status: 'success' }
}

/**
 * Set announcement banner.
 */
export async function adminSetAnnouncement(config: {
  enabled: boolean
  message: string
  type?: 'info' | 'warning' | 'success'
  dismissible?: boolean
  expires_at?: string | null
}): Promise<{ status: 'success' | 'error'; message?: string }> {
  const supabase = createClient()

  const { data: current } = await supabase.rpc('get_system_setting', { p_key: 'announcement' })
  const currentValue = current ?? {}

  const newValue = {
    ...currentValue,
    enabled: config.enabled,
    message: config.message,
    type: config.type ?? 'info',
    dismissible: config.dismissible ?? true,
    expires_at: config.expires_at ?? null,
  }

  const { error } = await supabase
    .from('system_settings')
    .update({ value: newValue })
    .eq('key', 'announcement')

  if (error) throw new Error(error.message)
  return { status: 'success' }
}

/**
 * Get current maintenance mode config.
 */
export async function adminGetMaintenanceMode(): Promise<MaintenanceModeConfig> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_system_setting', { p_key: 'maintenance_mode' })
  if (error) throw new Error(error.message)
  return data as MaintenanceModeConfig
}

// ============================================================
// Convenience helpers
// ============================================================

/**
 * Format expiry date for display.
 * Returns "Nov 6, 2027" or "Never expires" if null.
 */
export function formatExpiry(isoTimestamp: string | null): string {
  if (!isoTimestamp) return 'Never expires'
  return new Date(isoTimestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format days until expiry for display.
 * Returns "in 30 days" or "Expired" or "Never expires"
 */
export function formatDaysUntilExpiry(days: number | null): string {
  if (days === null) return 'Never expires'
  if (days < 0) return `Expired ${Math.abs(days)} day(s) ago`
  if (days === 0) return 'Expires today!'
  if (days === 1) return 'Expires tomorrow!'
  return `Expires in ${days} days`
}

/**
 * Calculate trial progress percentage (0-100).
 * Used for trial countdown UI.
 */
export function getTrialProgress(trialStartedAt: string | null, trialDays: number = 3): number {
  if (!trialStartedAt) return 0
  const startTime = new Date(trialStartedAt).getTime()
  const now = Date.now()
  const totalMs = trialDays * 24 * 60 * 60 * 1000
  const elapsedMs = now - startTime
  return Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100))
}

/**
 * Calculate remaining time for trial (in seconds).
 */
export function getTrialRemainingSeconds(trialStartedAt: string | null, trialDays: number = 3): number {
  if (!trialStartedAt) return 0
  const endTime = new Date(trialStartedAt).getTime() + trialDays * 24 * 60 * 60 * 1000
  return Math.max(0, Math.floor((endTime - Date.now()) / 1000))
}
