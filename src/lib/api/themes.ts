/**
 * API: THEMES — list all themes + select theme for current user
 */
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Theme = Database['public']['Tables']['themes']['Row']

export interface ThemeWithAccess extends Theme {
  can_use: boolean
  locked_reason?: 'PREMIUM_REQUIRED' | 'MASCOT_RESTRICTED'
}

/**
 * Get all themes (free + premium), with `can_use` flag computed for current user.
 */
export async function getThemes(): Promise<ThemeWithAccess[]> {
  const supabase = createClient()

  // 1. Get current user's premium status
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, selected_theme_id')
    .eq('id', userId)
    .single()

  const isPremium = profile?.is_premium ?? false
  const selectedThemeId = profile?.selected_theme_id

  // 2. Get all active themes
  const { data: themes, error } = await supabase
    .from('themes')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  // 3. Compute access for each theme
  return (themes ?? []).map((theme) => {
    let canUse = true
    let locked_reason: ThemeWithAccess['locked_reason']

    if (theme.is_premium && !isPremium) {
      canUse = false
      locked_reason = 'PREMIUM_REQUIRED'
    }

    return {
      ...theme,
      can_use: canUse,
      locked_reason,
      is_selected: theme.id === selectedThemeId,
    } as ThemeWithAccess & { is_selected: boolean }
  }) as ThemeWithAccess[]
}

/**
 * Select a theme for current user (with premium check via RPC).
 */
export async function selectTheme(themeId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // 1. Check if user can use this theme (server-side enforcement)
  const { data: access, error: accessError } = await supabase.rpc('can_use_theme', {
    p_theme_id: themeId,
  })
  if (accessError) throw new Error(accessError.message)

  if (access?.status !== 'success' || !access.can_use) {
    return {
      success: false,
      error: access?.message ?? 'Cannot use this theme',
    }
  }

  // 2. Get theme palette + glass settings to apply to profile
  const { data: theme, error: themeError } = await supabase
    .from('themes')
    .select('palette, glass_settings, wallpaper_url')
    .eq('id', themeId)
    .single()
  if (themeError) throw new Error(themeError.message)

  // 3. Update profile with selected theme + apply palette/glass settings
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

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

  return { success: true }
}
