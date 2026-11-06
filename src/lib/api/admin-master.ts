/**
 * API: ADMIN-MASTER — server-side admin functions using service role key
 *
 * Used by admin-panel.tsx (client) via API routes.
 * NEVER import this directly into client components — only in route handlers.
 *
 * @path src/lib/api/admin-master.ts
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { Tier } from '@/lib/constants/tiers'

function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } }
  )
}

// ============================================================
// Types
// ============================================================

export interface AdminUser {
  user_id: string
  email: string
  full_name: string | null
  tier: Tier
  stored_tier: Tier
  tier_expires_at: string | null
  trial_started_at: string | null
  is_admin: boolean
  is_premium: boolean
  is_vip: boolean
  days_until_expiry: number | null
  trial_days_remaining: number | null
  subscription_note: string | null
  transaction_count: number
  account_count: number
  last_sign_in_at: string | null
  created_at: string
}

export interface AdminStats {
  status: 'success' | 'error'
  message?: string
  total_users: number
  by_tier: Record<string, number>
  premium_users: number
  premium_conversion_rate: number
  trial_active: number
  trial_expired: number
  expired_users: number
  suspended_users: number
  recent_signups_7d: number
}

// ============================================================
// Service-role functions — accept callerUserId explicitly
// (because service role has no auth.uid() context)
// ============================================================

/**
 * List all users (admin only).
 * @param callerUserId - The admin user's ID (verified by route handler)
 */
export async function adminMasterListUsers(callerUserId: string): Promise<AdminUser[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_caller_user_id: callerUserId,
  })
  if (error) throw new Error(error.message)

  const result = data as { status: string; users?: AdminUser[]; message?: string }
  if (result.status === 'error') {
    throw new Error(result.message ?? 'Failed to list users')
  }
  return result.users ?? []
}

/**
 * Get admin stats.
 * @param callerUserId - The admin user's ID
 */
export async function adminMasterGetStats(callerUserId: string): Promise<AdminStats> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('admin_get_stats', {
    p_caller_user_id: callerUserId,
  })
  if (error) throw new Error(error.message)
  return data as AdminStats
}

/**
 * Change user tier.
 * @param callerUserId - The admin user's ID
 * @param userId - Target user's ID
 * @param tier - New tier
 * @param days - Subscription duration (null = no expiry)
 * @param note - Admin note
 */
export async function adminMasterSetUserTier(
  callerUserId: string,
  userId: string,
  tier: Tier,
  days: number | null = null,
  note: string | null = null
): Promise<{
  status: 'success' | 'error'
  message?: string
  user_id?: string
  new_tier?: Tier
  tier_expires_at?: string | null
}> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('admin_set_user_tier', {
    p_user_id: userId,
    p_tier: tier,
    p_days: days,
    p_note: note,
    p_caller_user_id: callerUserId,
  })
  if (error) throw new Error(error.message)
  return data
}

/**
 * Extend subscription by N days.
 */
export async function adminMasterExtendSubscription(
  callerUserId: string,
  userId: string,
  days: number
): Promise<{
  status: 'success' | 'error'
  message?: string
  user_id?: string
  new_expiry?: string
}> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('admin_extend_subscription', {
    p_user_id: userId,
    p_days: days,
    p_caller_user_id: callerUserId,
  })
  if (error) throw new Error(error.message)
  return data
}

/**
 * Suspend user (set tier = 'suspended').
 */
export async function adminMasterSuspendUser(callerUserId: string, userId: string, reason: string) {
  return adminMasterSetUserTier(callerUserId, userId, 'suspended', null, `Suspended: ${reason}`)
}

/**
 * Unsuspend user (set back to 'basic').
 */
export async function adminMasterUnsuspendUser(callerUserId: string, userId: string) {
  return adminMasterSetUserTier(callerUserId, userId, 'basic', null, 'Unsuspended by admin')
}

/**
 * Upgrade to Premium for 1 year (365 days).
 */
export async function adminMasterUpgradeToPremium(
  callerUserId: string,
  userId: string,
  note: string = 'Manual upgrade after payment'
) {
  return adminMasterSetUserTier(callerUserId, userId, 'premium', 365, note)
}

/**
 * Downgrade to Basic for 1 year.
 */
export async function adminMasterDowngradeToBasic(
  callerUserId: string,
  userId: string,
  note: string = 'Manual downgrade'
) {
  return adminMasterSetUserTier(callerUserId, userId, 'basic', 365, note)
}

/**
 * Mark user as expired (read-only mode).
 */
export async function adminMasterMarkExpired(callerUserId: string, userId: string) {
  return adminMasterSetUserTier(callerUserId, userId, 'expired', null, 'Marked expired by admin')
}

// ============================================================
// System settings — no caller_user_id needed (route handler verifies admin)
// ============================================================

/**
 * Toggle maintenance mode.
 */
export async function adminMasterSetMaintenanceMode(config: {
  enabled: boolean
  message: string
  expected_completion_hours?: number | null
  allow_admin_access?: boolean
}): Promise<{ status: 'success' | 'error'; message?: string }> {
  const supabase = createAdminClient()

  const { data: current } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()

  const currentValue = current?.value ?? {}
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
export async function adminMasterSetAnnouncement(config: {
  enabled: boolean
  message: string
  type?: 'info' | 'warning' | 'success'
  dismissible?: boolean
}): Promise<{ status: 'success' | 'error'; message?: string }> {
  const supabase = createAdminClient()

  const { data: current } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'announcement')
    .single()

  const currentValue = current?.value ?? {}
  const newValue = {
    ...currentValue,
    enabled: config.enabled,
    message: config.message,
    type: config.type ?? 'info',
    dismissible: config.dismissible ?? true,
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
export async function adminMasterGetMaintenanceMode(): Promise<{
  enabled: boolean
  message: string
  started_at: string | null
  expected_completion_hours: number | null
  allow_admin_access: boolean
}> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()

  if (error) throw new Error(error.message)
  return data.value as any
}

/**
 * Get current announcement.
 */
export async function adminMasterGetAnnouncement(): Promise<{
  enabled: boolean
  message: string
  type: 'info' | 'warning' | 'success'
  dismissible: boolean
  expires_at: string | null
}> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'announcement')
    .single()

  if (error) throw new Error(error.message)
  return data.value as any
}
