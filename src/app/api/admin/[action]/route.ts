/**
 * API Route: /api/admin/[action]/route.ts — Server-side admin endpoints
 *
 * Next.js 16 compatible (params is now a Promise).
 *
 * All routes verify is_admin = true via authenticated server client.
 * Then pass callerUserId to admin-master functions (which use service role).
 *
 * GET endpoints:
 *   /api/admin/users              → list all users
 *   /api/admin/stats              → admin dashboard stats
 *   /api/admin/maintenance        → get maintenance mode config
 *   /api/admin/announcement       → get announcement config
 *   /api/admin/whitelist          → list all whitelisted emails
 *
 * POST endpoints:
 *   /api/admin/users/tier         → change user tier
 *   /api/admin/users/extend       → extend subscription
 *   /api/admin/users/suspend      → suspend user
 *   /api/admin/users/unsuspend    → unsuspend user
 *   /api/admin/users/upgrade-premium    → upgrade to premium 1yr
 *   /api/admin/users/downgrade-basic    → downgrade to basic 1yr
 *   /api/admin/users/mark-expired       → mark as expired
 *   /api/admin/maintenance        → toggle maintenance mode
 *   /api/admin/announcement       → set announcement
 *   /api/admin/whitelist          → add/update whitelist entry
 *   /api/admin/whitelist/deactivate  → deactivate
 *   /api/admin/whitelist/reactivate   → reactivate
 *   /api/admin/whitelist/delete        → hard delete
 *   /api/admin/whitelist/grant-mascot  → grant mascot access
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
// Verify admin — returns userId if admin, else error response
// ============================================================
async function verifyAdmin(): Promise<{ error: NextResponse | null; userId: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized — please login' }, { status: 401 }),
      userId: null,
    }
  }

  // Check 1: ADMIN_EMAILS env var
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const isAdminByEmail = adminEmails.includes((user.email ?? '').toLowerCase())

  // Check 2: profiles.is_admin flag (more reliable)
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, tier')
    .eq('id', user.id)
    .single()
  const isAdminByFlag = profile?.is_admin === true || profile?.tier === 'admin'

  if (!isAdminByEmail && !isAdminByFlag) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden — admin access required' },
        { status: 403 }
      ),
      userId: null,
    }
  }

  return { error: null, userId: user.id }
}

// ============================================================
// GET handler
// ============================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { error, userId } = await verifyAdmin()
  if (error) return error
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ✅ Await params (Next.js 16)
  const { action } = await params

  try {
    switch (action) {
      case 'users': {
        const users = await adminMasterListUsers(userId)
        return NextResponse.json({ status: 'success', users })
      }
      case 'stats': {
        const stats = await adminMasterGetStats(userId)
        return NextResponse.json(stats)
      }
      case 'maintenance': {
        const config = await adminMasterGetMaintenanceMode()
        return NextResponse.json({ status: 'success', config })
      }
      case 'announcement': {
        const config = await adminMasterGetAnnouncement()
        return NextResponse.json({ status: 'success', config })
      }
      case 'whitelist': {
        const whitelist = await listWhitelist()
        return NextResponse.json({ status: 'success', whitelist })
      }
      default:
        return NextResponse.json({ error: `Unknown GET action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ============================================================
// POST handler
// ============================================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { error, userId } = await verifyAdmin()
  if (error) return error
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ✅ Await params (Next.js 16)
  const { action } = await params

  try {
    const body = await req.json()

    switch (action) {
      // ============================================================
      // Tier management — pass userId as callerUserId
      // ============================================================
      case 'users/tier': {
        if (!body.userId || !body.tier) {
          return NextResponse.json({ error: 'userId and tier required' }, { status: 400 })
        }
        const result = await adminMasterSetUserTier(
          userId,  // ← callerUserId
          body.userId,
          body.tier as Tier,
          body.days ?? null,
          body.note ?? null
        )
        return NextResponse.json(result)
      }

      case 'users/extend': {
        if (!body.userId || !body.days) {
          return NextResponse.json({ error: 'userId and days required' }, { status: 400 })
        }
        const result = await adminMasterExtendSubscription(userId, body.userId, body.days)
        return NextResponse.json(result)
      }

      case 'users/suspend': {
        if (!body.userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const result = await adminMasterSuspendUser(userId, body.userId, body.reason ?? 'No reason given')
        return NextResponse.json(result)
      }

      case 'users/unsuspend': {
        if (!body.userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const result = await adminMasterUnsuspendUser(userId, body.userId)
        return NextResponse.json(result)
      }

      case 'users/upgrade-premium': {
        if (!body.userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const result = await adminMasterUpgradeToPremium(userId, body.userId, body.note)
        return NextResponse.json(result)
      }

      case 'users/downgrade-basic': {
        if (!body.userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const result = await adminMasterDowngradeToBasic(userId, body.userId, body.note)
        return NextResponse.json(result)
      }

      case 'users/mark-expired': {
        if (!body.userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const result = await adminMasterMarkExpired(userId, body.userId)
        return NextResponse.json(result)
      }

      // ============================================================
      // Maintenance mode & announcement — no callerUserId needed
      // ============================================================
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

      // ============================================================
      // Whitelist management
      // ============================================================
      case 'whitelist': {
        if (!body.email) {
          return NextResponse.json({ error: 'email required' }, { status: 400 })
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
        return NextResponse.json({ status: 'success', entry: result })
      }

      case 'whitelist/deactivate': {
        if (!body.email) {
          return NextResponse.json({ error: 'email required' }, { status: 400 })
        }
        await removeFromWhitelist(body.email)
        return NextResponse.json({ status: 'success' })
      }

      case 'whitelist/reactivate': {
        if (!body.email) {
          return NextResponse.json({ error: 'email required' }, { status: 400 })
        }
        await reactivateInWhitelist(body.email)
        return NextResponse.json({ status: 'success' })
      }

      case 'whitelist/delete': {
        if (!body.email) {
          return NextResponse.json({ error: 'email required' }, { status: 400 })
        }
        await deleteFromWhitelist(body.email)
        return NextResponse.json({ status: 'success' })
      }

      case 'whitelist/grant-mascot': {
        if (!body.email || !body.mascotId) {
          return NextResponse.json({ error: 'email and mascotId required' }, { status: 400 })
        }
        await grantMascotAccess(body.mascotId, body.email)
        return NextResponse.json({ status: 'success' })
      }

      default:
        return NextResponse.json({ error: `Unknown POST action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
