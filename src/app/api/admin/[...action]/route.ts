/**
 * API Route: /api/admin/[action]/route.ts
 *
 * Sprint 2 Fix: Better error handling (return JSON, never HTML)
 * Next.js 16 compatible (params is Promise)
 *
 * All routes verify is_admin = true via authenticated server client.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  adminMasterListUsers,
  adminMasterGetStats,
  adminMasterSetUserTier,
  adminMasterExtendSubscription,
  adminMasterSuspendUser,
  adminMasterUnsuspendUser,
  adminMasterUpgradeToPremium,
  adminMasterDowngradeToBasic,
  adminMasterMarkExpired,
  adminMasterSetMaintenanceMode,
  adminMasterGetMaintenanceMode,
  adminMasterSetAnnouncement,
  adminMasterGetAnnouncement,
} from '@/lib/api/admin-master'
import {
  listWhitelist,
  addToWhitelist,
  removeFromWhitelist,
  reactivateInWhitelist,
  deleteFromWhitelist,
  grantMascotAccess,
} from '@/lib/api/whitelist'
import type { Tier } from '@/lib/constants/tiers'

// ============================================================
// Helper: safe JSON response (never throw to client)
// ============================================================
function jsonError(message: string, status: number = 500) {
  return NextResponse.json({ status: 'error', error: message }, { status })
}

function jsonSuccess(data: any) {
  return NextResponse.json({ status: 'success', ...data })
}

// ============================================================
// Verify admin — returns userId if admin, else error response
// ============================================================
async function verifyAdmin(): Promise<{ error: NextResponse | null; userId: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        error: NextResponse.json(
          { status: 'error', error: 'Unauthorized — silakan login' },
          { status: 401 }
        ),
        userId: null,
      }
    }

    // Check 1: ADMIN_EMAILS env var
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    const isAdminByEmail = adminEmails.includes((user.email ?? '').toLowerCase())

    // Check 2: profiles.is_admin flag
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('is_admin, tier')
      .eq('id', user.id)
      .single()

    if (profileErr) {
      console.error('Admin verify error:', profileErr)
    }
    const isAdminByFlag = profile?.is_admin === true || profile?.tier === 'admin'

    if (!isAdminByEmail && !isAdminByFlag) {
      return {
        error: NextResponse.json(
          { status: 'error', error: 'Forbidden — akses admin diperlukan' },
          { status: 403 }
        ),
        userId: null,
      }
    }

    return { error: null, userId: user.id }
  } catch (err: any) {
    console.error('verifyAdmin exception:', err)
    return {
      error: NextResponse.json(
        { status: 'error', error: 'Server error: ' + (err?.message ?? 'Unknown') },
        { status: 500 }
      ),
      userId: null,
    }
  }
}

// ============================================================
// GET handler
// ============================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ action: string[] }> }
) {
  const { error, userId } = await verifyAdmin()
  if (error) return error
  if (!userId) return jsonError('Unauthorized', 401)

  let action: string
  try {
    const paramsData = await params
    action = paramsData.action.join('/')
  } catch (err: any) {
    return jsonError('Invalid route params: ' + err.message, 400)
  }

  try {
    switch (action) {
      case 'users': {
        const users = await adminMasterListUsers(userId)
        return jsonSuccess({ users })
      }
      case 'stats': {
        const stats = await adminMasterGetStats(userId)
        return NextResponse.json(stats)
      }
      case 'maintenance': {
        const config = await adminMasterGetMaintenanceMode()
        return jsonSuccess({ config })
      }
      case 'announcement': {
        const config = await adminMasterGetAnnouncement()
        return jsonSuccess({ config })
      }
      case 'whitelist': {
        const whitelist = await listWhitelist()
        return jsonSuccess({ whitelist })
      }
      default:
        return jsonError(`Unknown GET action: ${action}`, 400)
    }
  } catch (err: any) {
    console.error(`GET /api/admin/${action} error:`, err)
    return jsonError(err.message ?? 'Internal server error', 500)
  }
}

// ============================================================
// POST handler
// ============================================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string[] }> }
) {
  const { error, userId } = await verifyAdmin()
  if (error) return error
  if (!userId) return jsonError('Unauthorized', 401)

  // Sprint 8: Create supabase client for direct DB queries (deactivate, delete, etc.)
  const supabase = await createClient()

  let action: string
  let body: any
  try {
    const paramsData = await params
    action = paramsData.action.join('/')
  } catch (err: any) {
    return jsonError('Invalid route params: ' + err.message, 400)
  }

  try {
    body = await req.json()
  } catch (err: any) {
    return jsonError('Invalid JSON body: ' + err.message, 400)
  }

  try {
    switch (action) {
      // Tier management
      case 'users/tier': {
        if (!body.userId || !body.tier) {
          return jsonError('userId and tier diperlukan', 400)
        }
        const result = await adminMasterSetUserTier(
          userId,
          body.userId,
          body.tier as Tier,
          body.days ?? null,
          body.note ?? null
        )
        return NextResponse.json(result)
      }
      case 'users/extend': {
        if (!body.userId || !body.days) {
          return jsonError('userId and days diperlukan', 400)
        }
        const result = await adminMasterExtendSubscription(userId, body.userId, body.days)
        return NextResponse.json(result)
      }
      case 'users/suspend': {
        if (!body.userId) {
          return jsonError('userId diperlukan', 400)
        }
        const result = await adminMasterSuspendUser(userId, body.userId, body.reason ?? 'No reason given')
        return NextResponse.json(result)
      }
      case 'users/unsuspend': {
        if (!body.userId) {
          return jsonError('userId diperlukan', 400)
        }
        const result = await adminMasterUnsuspendUser(userId, body.userId)
        return NextResponse.json(result)
      }
      case 'users/upgrade-premium': {
        if (!body.userId) {
          return jsonError('userId diperlukan', 400)
        }
        const result = await adminMasterUpgradeToPremium(userId, body.userId, body.note)
        return NextResponse.json(result)
      }
      case 'users/downgrade-basic': {
        if (!body.userId) {
          return jsonError('userId diperlukan', 400)
        }
        const result = await adminMasterDowngradeToBasic(userId, body.userId, body.note)
        return NextResponse.json(result)
      }
      case 'users/mark-expired': {
        if (!body.userId) {
          return jsonError('userId diperlukan', 400)
        }
        const result = await adminMasterMarkExpired(userId, body.userId)
        return NextResponse.json(result)
      }

      // System settings
      case 'maintenance': {
        const result = await adminMasterSetMaintenanceMode({
          enabled: body.enabled,
          message: body.message ?? '',
          expected_completion_hours: body.expected_completion_hours ?? null,
          allow_admin_access: body.allow_admin_access ?? true,
        })
        return NextResponse.json(result)
      }
      case 'announcement': {
        const result = await adminMasterSetAnnouncement({
          enabled: body.enabled,
          message: body.message ?? '',
          type: body.type ?? 'info',
          dismissible: body.dismissible ?? true,
        })
        return NextResponse.json(result)
      }

      // Whitelist
      case 'whitelist': {
        if (!body.email) {
          return jsonError('email diperlukan', 400)
        }
        const result = await addToWhitelist({
          email: body.email,
          full_name: body.full_name,
          is_premium: body.is_premium ?? false,
          assigned_theme: body.assigned_theme,
          assigned_mascot: body.assigned_mascot,
          notes: body.notes,
          invited_by: body.invited_by ?? 'admin',
        })
        return jsonSuccess({ entry: result })
      }
      case 'whitelist/deactivate': {
        if (!body.email) return jsonError('email diperlukan', 400)
        await removeFromWhitelist(body.email)
        // Sprint 8: Also set tier='suspended' so user can't access app
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', body.email)
          .single()
        if (profile) {
          await adminMasterSetUserTier(userId, profile.id, 'suspended', null, 'Deactivated from whitelist')
        }
        return jsonSuccess({})
      }
      case 'whitelist/reactivate': {
        if (!body.email) return jsonError('email diperlukan', 400)
        await reactivateInWhitelist(body.email)
        // Sprint 8: Also restore tier='basic' so user can access app again
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, tier')
          .ilike('email', body.email)
          .single()
        if (profile && profile.tier === 'suspended') {
          await adminMasterSetUserTier(userId, profile.id, 'basic', null, 'Reactivated from whitelist')
        }
        return jsonSuccess({})
      }
      case 'whitelist/delete': {
        if (!body.email) return jsonError('email diperlukan', 400)
        await deleteFromWhitelist(body.email)
        // Sprint 8: Delete all user data + set tier='deleted'
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', body.email)
          .single()
        if (profile) {
          // Delete all user data (order matters for FK constraints)
          await supabase.from('transactions').delete().eq('user_id', profile.id)
          await supabase.from('budgets').delete().eq('user_id', profile.id)
          await supabase.from('subcategories').delete().eq('user_id', profile.id)
          await supabase.from('categories').delete().eq('user_id', profile.id)
          await supabase.from('accounts').delete().eq('user_id', profile.id)
          await supabase.from('shared_access').delete().or(`owner_user_id.eq.${profile.id},shared_with_user_id.eq.${profile.id}`)
          // Set tier='deleted' (keep profile row for admin panel visibility)
          await adminMasterSetUserTier(userId, profile.id, 'deleted', null, 'Deleted by admin — all data removed')
        }
        return jsonSuccess({})
      }
      case 'whitelist/grant-mascot': {
        if (!body.email || !body.mascotId) {
          return jsonError('email and mascotId diperlukan', 400)
        }
        await grantMascotAccess(body.mascotId, body.email)
        return jsonSuccess({})
      }

      default:
        return jsonError(`Unknown POST action: ${action}`, 400)
    }
  } catch (err: any) {
    console.error(`POST /api/admin/${action} error:`, err)
    return jsonError(err.message ?? 'Internal server error', 500)
  }
}
