/**
 * API: MASCOTS — Optimized: client-side whitelist check
 */
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Mascot = Database['public']['Tables']['mascots']['Row']

export interface MascotWithAccess extends Mascot {
  can_use: boolean
  is_restricted: boolean
  locked_reason?: 'PREMIUM_REQUIRED' | 'MASCOT_RESTRICTED'
}

// Mascots that are restricted to specific emails (via mascot_whitelist table)
const RESTRICTED_MASCOT_IDS = ['elephant']

/**
 * Get all mascots + user's premium status + whitelist.
 * Returns mascots with `can_use` flag computed client-side.
 */
export async function getMascots(): Promise<{ mascots: MascotWithAccess[]; isPremium: boolean; selectedMascotId: string | null }> {
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const userEmail = userData.user.email ?? ''

  // Parallel: profile + mascots + whitelist
  const [profileRes, mascotsRes, whitelistRes] = await Promise.all([
    supabase.from('profiles').select('is_premium, selected_mascot_id, icon_name').eq('id', userData.user.id).single(),
    supabase.from('mascots').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('mascot_whitelist').select('mascot_id').eq('email', userEmail),
  ])

  if (mascotsRes.error) throw new Error(mascotsRes.error.message)

  const isPremium = profileRes.data?.is_premium ?? false
  const selectedMascotId = profileRes.data?.selected_mascot_id ?? profileRes.data?.icon_name ?? null

  // Build whitelist set
  const whitelistedMascotIds = new Set((whitelistRes.data ?? []).map(w => w.mascot_id))

  const mascots: MascotWithAccess[] = (mascotsRes.data ?? []).map((mascot) => {
    const isRestricted = RESTRICTED_MASCOT_IDS.includes(mascot.id)
    let canUse = true
    let locked_reason: MascotWithAccess['locked_reason']

    if (isRestricted) {
      // Restricted mascot: only allow if user has whitelist entry
      canUse = whitelistedMascotIds.has(mascot.id)
      if (!canUse) locked_reason = 'MASCOT_RESTRICTED'
    } else if (mascot.is_premium && !isPremium) {
      canUse = false
      locked_reason = 'PREMIUM_REQUIRED'
    }

    return { ...mascot, can_use: canUse, is_restricted: isRestricted, locked_reason }
  })

  return { mascots, isPremium, selectedMascotId }
}

/**
 * Select a mascot — Optimized: 1 API call.
 */
export async function selectMascot(mascotId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({
      selected_mascot_id: mascotId,
      icon_name: mascotId,
    })
    .eq('id', userData.user.id)

  if (error) throw new Error(error.message)

  return { success: true }
}
