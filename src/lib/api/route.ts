/**
 * API Route: /api/admin/* — Server-side admin endpoints
 *
 * All routes verify is_admin = true via service role.
 * Used by admin-panel.tsx (client) to interact with admin functions.
 *
 * Routes:
 *   GET    /api/admin/users          → list all users
 *   GET    /api/admin/stats          → admin dashboard stats
 *   POST   /api/admin/users/tier     → change user tier
 *   POST   /api/admin/users/extend   → extend subscription
 *   POST   /api/admin/users/suspend  → suspend user
 *   POST   /api/admin/users/unsuspend → unsuspend user
 *   POST   /api/admin/users/upgrade-premium → upgrade to premium (1yr)
 *   POST   /api/admin/users/downgrade-basic → downgrade to basic (1yr)
 *   POST   /api/admin/users/mark-expired → mark as expired
 *   GET    /api/admin/maintenance    → get maintenance mode
 *   POST   /api/admin/maintenance    → toggle maintenance mode
 *   GET    /api/admin/announcement    → get announcement
 *   POST   /api/admin/announcement    → set announcement
 *
 * @path src/app/api/admin/[action]/route.ts
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
import type { Tier } from '@/lib/constants/tiers'

/**
 * Verify the current user is admin.
 * Returns userId if admin, else returns null + error response.
 */
async function verifyAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), userId: null }
  }

  // Fetch profile to check is_admin flag
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, tier')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin && profile?.tier !== 'admin') {
    return {
      error: NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 }),
      userId: null,
    }
  }

  return { error: null, userId: user.id }
}

// ============================================================
// GET handlers
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: { action: string } }
) {
  const { error } = await verifyAdmin()
  if (error) return error

  try {
    switch (params.action) {
      case 'users': {
        const users = await adminMasterListUsers()
        return NextResponse.json({ status: 'success', users })
      }
      case 'stats': {
        const stats = await adminMasterGetStats()
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
      default:
        return NextResponse.json({ error: `Unknown GET action: ${params.action}` }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ============================================================
// POST handlers
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: { action: string } }
) {
  const { error } = await verifyAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { action } = params

    switch (action) {
      // ============================================================
      // Tier management
      // ============================================================
      case 'users/tier': {
        // body: { userId, tier, days?, note? }
        if (!body.userId || !body.tier) {
          return NextResponse.json({ error: 'userId and tier required' }, { status: 400 })
        }
        const result = await adminMasterSetUserTier(
          body.userId,
          body.tier as Tier,
          body.days ?? null,
          body.note ?? null
        )
        return NextResponse.json(result)
      }

      case 'users/extend': {
        // body: { userId, days }
        if (!body.userId || !body.days) {
          return NextResponse.json({ error: 'userId and days required' }, { status: 400 })
        }
        const result = await adminMasterExtendSubscription(body.userId, body.days)
        return NextResponse.json(result)
      }

      case 'users/suspend': {
        if (!body.userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const result = await adminMasterSuspendUser(body.userId, body.reason ?? 'No reason given')
        return NextResponse.json(result)
      }

      case 'users/unsuspend': {
        if (!body.userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const result = await adminMasterUnsuspendUser(body.userId)
        return NextResponse.json(result)
      }

      case 'users/upgrade-premium': {
        if (!body.userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const result = await adminMasterUpgradeToPremium(body.userId, body.note)
        return NextResponse.json(result)
      }

      case 'users/downgrade-basic': {
        if (!body.userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const result = await adminMasterDowngradeToBasic(body.userId, body.note)
        return NextResponse.json(result)
      }

      case 'users/mark-expired': {
        if (!body.userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const result = await adminMasterMarkExpired(body.userId)
        return NextResponse.json(result)
      }

      // ============================================================
      // Maintenance mode & announcement
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

      default:
        return NextResponse.json({ error: `Unknown POST action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
