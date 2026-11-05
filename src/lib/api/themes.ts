/**
 * API: THEMES — Optimized: no RPC check, client-side premium check
 */
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Theme = Database['public']['Tables']['themes']['Row']

export interface ThemeWithAccess extends Theme {
  can_use: boolean
  locked_reason?: 'PREMIUM_REQUIRED'
}

// Mascot whitelist for restricted mascots (e.g., elephant for Elsa)
const RESTRICTED_MASCOT_IDS = ['elephant']

// VIP themes that are restricted to specific emails (via theme_whitelist table)
// Currently empty — elephant-pink is now public premium (not VIP restricted)
const VIP_THEME_IDS: string[] = []

/**
 * Get all themes + user's premium status + VIP whitelist.
 * Returns themes with `can_use` flag computed client-side.
 */
export async function getThemes(): Promise<{ themes: ThemeWithAccess[]; isPremium: boolean; selectedThemeId: string | null }> {
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const userEmail = userData.user.email ?? ''

  // Parallel: profile + themes + VIP whitelist
  const [profileRes, themesRes, whitelistRes] = await Promise.all([
    supabase.from('profiles').select('is_premium, selected_theme_id').eq('id', userData.user.id).single(),
    supabase.from('themes').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('theme_whitelist').select('theme_id').eq('email', userEmail),
  ])

  if (themesRes.error) throw new Error(themesRes.error.message)

  const isPremium = profileRes.data?.is_premium ?? false
  const selectedThemeId = profileRes.data?.selected_theme_id ?? null

  // Build VIP whitelist set
  const vipWhitelistedThemeIds = new Set((whitelistRes.data ?? []).map(w => w.theme_id))

  const themes: ThemeWithAccess[] = (themesRes.data ?? []).map((theme) => {
    let canUse = true
    let locked_reason: ThemeWithAccess['locked_reason']

    // Check if theme is VIP (restricted)
    if (VIP_THEME_IDS.includes(theme.id)) {
      // VIP theme: only allow if user has whitelist entry
      canUse = vipWhitelistedThemeIds.has(theme.id)
      if (!canUse) {
        locked_reason = 'PREMIUM_REQUIRED' // reuse same lock icon
      }
    } else if (theme.is_premium && !isPremium) {
      canUse = false
      locked_reason = 'PREMIUM_REQUIRED'
    }

    return { ...theme, can_use: canUse, locked_reason }
  })

  return { themes, isPremium, selectedThemeId }
}

/**
 * Select a theme — Optimized: 1 API call (update profile directly).
 * VIP check done client-side (in getThemes).
 */
export async function selectTheme(themeId: string, isPremium: boolean): Promise<{ success: boolean; error?: string; theme?: Theme }> {
  const supabase = createClient()

  const { data: theme, error: themeError } = await supabase
    .from('themes')
    .select('*')
    .eq('id', themeId)
    .single()
  if (themeError) throw new Error(themeError.message)

  // Client-side premium check
  if (theme.is_premium && !isPremium) {
    return { success: false, error: 'Theme premium — upgrade akun untuk pakai' }
  }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  // Update profile — DON'T override wallpaper_url (keep mascot wallpaper)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      selected_theme_id: themeId,
      palette: theme.palette,
      glass_settings: theme.glass_settings,
      // wallpaper_url is NOT updated here — it's tied to mascot selection
    })
    .eq('id', userData.user.id)

  if (updateError) throw new Error(updateError.message)

  return { success: true, theme }
}
