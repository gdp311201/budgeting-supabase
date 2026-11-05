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

/**
 * Get all themes + user's premium status.
 * Returns themes with `can_use` flag computed client-side (no RPC).
 */
export async function getThemes(): Promise<{ themes: ThemeWithAccess[]; isPremium: boolean; selectedThemeId: string | null }> {
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  // Parallel: get profile + themes
  const [profileRes, themesRes] = await Promise.all([
    supabase.from('profiles').select('is_premium, selected_theme_id').eq('id', userData.user.id).single(),
    supabase.from('themes').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
  ])

  if (themesRes.error) throw new Error(themesRes.error.message)

  const isPremium = profileRes.data?.is_premium ?? false
  const selectedThemeId = profileRes.data?.selected_theme_id ?? null

  const themes: ThemeWithAccess[] = (themesRes.data ?? []).map((theme) => {
    let canUse = true
    let locked_reason: ThemeWithAccess['locked_reason']

    if (theme.is_premium && !isPremium) {
      canUse = false
      locked_reason = 'PREMIUM_REQUIRED'
    }

    return { ...theme, can_use: canUse, locked_reason }
  })

  return { themes, isPremium, selectedThemeId }
}

/**
 * Select a theme — Optimized: 1 API call (update profile directly).
 * No RPC check (premium check done client-side in getThemes).
 */
export async function selectTheme(themeId: string, isPremium: boolean): Promise<{ success: boolean; error?: string; theme?: Theme }> {
  const supabase = createClient()

  // Get theme data (1 call)
  const { data: theme, error: themeError } = await supabase
    .from('themes')
    .select('*')
    .eq('id', themeId)
    .single()
  if (themeError) throw new Error(themeError.message)

  // Client-side premium check (no RPC)
  if (theme.is_premium && !isPremium) {
    return { success: false, error: 'Theme premium — upgrade akun untuk pakai' }
  }

  // Get user ID
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  // Update profile (1 call)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      selected_theme_id: themeId,
      palette: theme.palette,
      glass_settings: theme.glass_settings,
      wallpaper_url: theme.wallpaper_url,
    })
    .eq('id', userData.user.id)

  if (updateError) throw new Error(updateError.message)

  return { success: true, theme }
}
