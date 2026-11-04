/**
 * API: WHITELIST — admin-only functions to manage allowed_emails
 *
 * WARNING: This uses service role key. Only run server-side!
 * (in Route Handlers or Server Actions, never in client components)
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

type AllowedEmail = Database['public']['Tables']['allowed_emails']['Row']

function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (NEVER expose to client)'
    )
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } }
  )
}

/**
 * List all whitelisted emails.
 * Server-only — uses service role key.
 */
export async function listWhitelist(): Promise<AllowedEmail[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('allowed_emails')
    .select('*')
    .order('invited_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Add an email to whitelist.
 */
export async function addToWhitelist(params: {
  email: string
  full_name?: string
  is_premium?: boolean
  assigned_theme?: string
  assigned_mascot?: string
  notes?: string
  invited_by?: string
}): Promise<AllowedEmail> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('allowed_emails')
    .upsert(
      {
        email: params.email.toLowerCase().trim(),
        full_name: params.full_name,
        is_premium: params.is_premium ?? false,
        assigned_theme: params.assigned_theme,
        assigned_mascot: params.assigned_mascot,
        notes: params.notes,
        invited_by: params.invited_by ?? 'admin',
      },
      { onConflict: 'email' }
    )
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Remove an email from whitelist (deactivate, don't delete).
 */
export async function removeFromWhitelist(email: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('allowed_emails')
    .update({ is_active: false })
    .eq('email', email.toLowerCase().trim())
  if (error) throw new Error(error.message)
}

/**
 * Reactivate a deactivated whitelist entry.
 */
export async function reactivateInWhitelist(email: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('allowed_emails')
    .update({ is_active: true })
    .eq('email', email.toLowerCase().trim())
  if (error) throw new Error(error.message)
}

/**
 * Hard delete from whitelist (permanently remove).
 */
export async function deleteFromWhitelist(email: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('allowed_emails')
    .delete()
    .eq('email', email.toLowerCase().trim())
  if (error) throw new Error(error.message)
}

/**
 * Grant a private mascot to an email (e.g., grant elephant to a VIP customer).
 */
export async function grantMascotAccess(mascotId: string, email: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('mascot_whitelist')
    .upsert(
      {
        mascot_id: mascotId,
        email: email.toLowerCase().trim(),
        granted_by: 'admin',
      },
      { onConflict: 'mascot_id,email' }
    )
  if (error) throw new Error(error.message)
}

/**
 * Check if current user is admin (via email match).
 * Used to gate /admin route.
 */
export async function isAdmin(userEmail: string | undefined, adminEmails: string[]): Promise<boolean> {
  if (!userEmail) return false
  return adminEmails.some((e) => e.toLowerCase() === userEmail.toLowerCase())
}
