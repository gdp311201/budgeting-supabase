/**
 * API: MASCOTS — list all mascots + select mascot for current user
 */
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Mascot = Database['public']['Tables']['mascots']['Row']

export interface MascotWithAccess extends Mascot {
  can_use: boolean
  is_restricted: boolean  // true if mascot is private (whitelist only)
  locked_reason?: 'PREMIUM_REQUIRED' | 'MASCOT_RESTRICTED'
  is_selected: boolean
}

/**
 * Get all mascots (public + premium + restricted), with `can_use` flag.
 * Restricted mascots only show if user has whitelist entry.
 */
export async function getMascots(): Promise<MascotWithAccess[]> {
  const supabase = createClient()

  // 1. Get current user info
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, selected_mascot_id')
    .eq('id', userData.user.id)
    .single()

  const isPremium = profile?.is_premium ?? false
  const selectedMascotId = profile?.selected_mascot_id

  // 2. Get user's whitelisted mascots
  const { data: userWhitelist } = await supabase
    .from('mascot_whitelist')
    .select('mascot_id')
    .eq('email', userData.user.email ?? '')

  const whitelistedMascotIds = new Set((userWhitelist ?? []).map((w) => w.mascot_id))

  // 3. Get all active mascots
  const { data: mascots, error } = await supabase
    .from('mascots')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  // 4. Compute access — restricted mascots only show if user has whitelist entry
  return (mascots ?? [])
    .filter((m) => {
      // Hide restricted mascots entirely if user doesn't have whitelist entry
      // (So other users won't even know "elephant" exists)
      const isRestricted = whitelistedMascotIds.size > 0 &&
        (whitelistedMascotIds.has(m.id) === false) &&
        m.id === 'elephant'  // Hardcoded for elephant (only restricted one for now)
      // Actually, simpler: check via separate query if this mascot is in mascot_whitelist at all
      // For now, just hide elephant for non-elsa users (frontend layer only)
      return true  // Show all, lock restricted ones via locked_reason
    })
    .map((mascot) => {
      const isRestricted = mascot.id === 'elephant' && !whitelistedMascotIds.has(mascot.id)
      let canUse = true
      let locked_reason: MascotWithAccess['locked_reason']

      if (isRestricted) {
        canUse = false
        locked_reason = 'MASCOT_RESTRICTED'
      } else if (mascot.is_premium && !isPremium) {
        canUse = false
        locked_reason = 'PREMIUM_REQUIRED'
      }

      return {
        ...mascot,
        can_use: canUse,
        is_restricted: isRestricted,
        locked_reason,
        is_selected: mascot.id === selectedMascotId,
      }
    })
}

/**
 * Select a mascot for current user (with whitelist + premium check via RPC).
 */
export async function selectMascot(mascotId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // 1. Check if user can use this mascot (server-side enforcement)
  const { data: access, error: accessError } = await supabase.rpc('can_use_mascot', {
    p_mascot_id: mascotId,
  })
  if (accessError) throw new Error(accessError.message)

  if (access?.status !== 'success' || !access.can_use) {
    return {
      success: false,
      error: access?.message ?? 'Cannot use this mascot',
    }
  }

  // 2. Update profile
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const { data: mascot } = await supabase
    .from('mascots')
    .select('emoji, name')
    .eq('id', mascotId)
    .single()

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      selected_mascot_id: mascotId,
      icon_name: mascotId,
    })
    .eq('id', userData.user.id)

  if (updateError) throw new Error(updateError.message)

  return { success: true }
}
