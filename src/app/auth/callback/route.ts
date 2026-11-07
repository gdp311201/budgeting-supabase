import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * OAuth callback handler — Sprint 8 Security Fix
 *
 * CRITICAL: Check whitelist + tier BEFORE allowing login.
 * Without this, ANYONE with a Google account can access the app.
 *
 * Flow:
 * 1. Exchange code for session
 * 2. Get user email from session
 * 3. Check if email is in allowed_emails AND is_active = true
 * 4. Check if user's tier is NOT 'suspended' or 'deleted'
 * 5. If any check fails → sign out + redirect to /login?error=...
 * 6. If all pass → redirect to app
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') ?? '/'

  if (!code) {
    return NextResponse.redirect(requestUrl.origin + '/login')
  }

  const supabase = await createClient()

  // Step 1: Exchange code for session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    console.error('Auth exchange error:', exchangeError.message)
    return NextResponse.redirect(requestUrl.origin + '/login?error=auth_failed')
  }

  // Step 2: Get user from session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    await supabase.auth.signOut()
    return NextResponse.redirect(requestUrl.origin + '/login?error=no_user')
  }

  const userEmail = user.email.toLowerCase()

  // Step 3: Check if email is in allowed_emails AND is_active = true
  const { data: whitelistEntry, error: whitelistError } = await supabase
    .from('allowed_emails')
    .select('is_active')
    .eq('email', userEmail)
    .single()

  if (whitelistError || !whitelistEntry) {
    // Email not in whitelist — block
    console.warn(`Login blocked: ${userEmail} not in whitelist`)
    await supabase.auth.signOut()
    return NextResponse.redirect(
      requestUrl.origin + '/login?error=not_allowed'
    )
  }

  if (!whitelistEntry.is_active) {
    // Email deactivated — block
    console.warn(`Login blocked: ${userEmail} is deactivated`)
    await supabase.auth.signOut()
    return NextResponse.redirect(
      requestUrl.origin + '/login?error=deactivated'
    )
  }

  // Step 4: Check user's tier (if profile exists)
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  if (profile) {
    if (profile.tier === 'suspended') {
      console.warn(`Login blocked: ${userEmail} is suspended`)
      await supabase.auth.signOut()
      return NextResponse.redirect(
        requestUrl.origin + '/login?error=suspended'
      )
    }

    if (profile.tier === 'deleted') {
      console.warn(`Login blocked: ${userEmail} is deleted`)
      await supabase.auth.signOut()
      return NextResponse.redirect(
        requestUrl.origin + '/login?error=deleted'
      )
    }
  }

  // Step 5: Check maintenance mode (non-admin users blocked during maintenance)
  const { data: maintenanceSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()

  if (maintenanceSetting?.value) {
    const maintenance = maintenanceSetting.value as any
    if (maintenance.enabled) {
      // Check if user is admin
      const isAdmin = profile?.tier === 'admin' || profile?.is_admin === true
      if (!isAdmin || !maintenance.allow_admin_access) {
        console.warn(`Login blocked: ${userEmail} — maintenance mode active`)
        await supabase.auth.signOut()
        return NextResponse.redirect(
          requestUrl.origin + '/login?error=maintenance'
        )
      }
    }
  }

  // Step 6: All checks passed — redirect to app
  return NextResponse.redirect(requestUrl.origin + redirect)
}
