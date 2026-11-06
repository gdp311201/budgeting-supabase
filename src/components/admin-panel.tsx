'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  listWhitelist,
  addToWhitelist,
  removeFromWhitelist,
  reactivateInWhitelist,
  deleteFromWhitelist,
  grantMascotAccess,
} from '@/lib/api/whitelist'
import type { Database } from '@/lib/types/database'
import { cn } from '@/lib/utils/format'
import { TIER_INFO, type Tier, formatPrice } from '@/lib/constants/tiers'

type AllowedEmail = Database['public']['Tables']['allowed_emails']['Row']

// ============================================================
// Types — admin user from API
// ============================================================
interface AdminUser {
  user_id: string
  email: string
  full_name: string | null
  tier: Tier
  stored_tier: Tier
  tier_expires_at: string | null
  trial_started_at: string | null
  is_admin: boolean
  is_premium: boolean
  is_vip: boolean
  days_until_expiry: number | null
  trial_days_remaining: number | null
  subscription_note: string | null
  transaction_count: number
  account_count: number
  last_sign_in_at: string | null
  created_at: string
}

interface AdminStats {
  status: 'success' | 'error'
  message?: string
  total_users: number
  by_tier: Record<string, number>
  premium_users: number
  premium_conversion_rate: number
  trial_active: number
  trial_expired: number
  expired_users: number
  suspended_users: number
  recent_signups_7d: number
}

interface MaintenanceConfig {
  enabled: boolean
  message: string
  started_at: string | null
  expected_completion_hours: number | null
  allow_admin_access: boolean
}

interface AnnouncementConfig {
  enabled: boolean
  message: string
  type: 'info' | 'warning' | 'success'
  dismissible: boolean
  expires_at: string | null
}

type TabKey = 'stats' | 'users' | 'allowlist' | 'maintenance' | 'announcement'

interface Props {
  onClose: () => void
}

// ============================================================
// Helper formatters
// ============================================================
function formatExpiry(isoTimestamp: string | null): string {
  if (!isoTimestamp) return 'Never'
  return new Date(isoTimestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDays(days: number | null): string {
  if (days === null) return '∞'
  if (days < 0) return `${Math.abs(days)}d ago`
  if (days === 0) return 'Today!'
  return `${days}d`
}

// ============================================================
// Main component
// ============================================================
export default function AdminPanel({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('stats')

  // Whitelist state (existing feature)
  const [whitelist, setWhitelist] = useState<AllowedEmail[]>([])
  const [whitelistLoading, setWhitelistLoading] = useState(true)
  const [whitelistError, setWhitelistError] = useState<string | null>(null)

  // Form state for whitelist
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newPremium, setNewPremium] = useState(false)
  const [newTheme, setNewTheme] = useState('')
  const [newMascot, setNewMascot] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Users state (new feature)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)

  // Stats state
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Maintenance state
  const [maintenance, setMaintenance] = useState<MaintenanceConfig | null>(null)
  const [maintenanceForm, setMaintenanceForm] = useState({
    enabled: false,
    message: '',
    expected_completion_hours: 2,
    allow_admin_access: true,
  })
  const [maintenanceSaving, setMaintenanceSaving] = useState(false)

  // Announcement state
  const [announcement, setAnnouncement] = useState<AnnouncementConfig | null>(null)
  const [announcementForm, setAnnouncementForm] = useState({
    enabled: false,
    message: '',
    type: 'info' as 'info' | 'warning' | 'success',
    dismissible: true,
  })
  const [announcementSaving, setAnnouncementSaving] = useState(false)

  // ============================================================
  // Loaders
  // ============================================================
  const loadWhitelist = useCallback(async () => {
    setWhitelistLoading(true)
    setWhitelistError(null)
    try {
      const data = await listWhitelist()
      setWhitelist(data)
    } catch (err: any) {
      setWhitelistError(err.message ?? 'Failed to load whitelist')
    } finally {
      setWhitelistLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    setUsersError(null)
    try {
      const res = await fetch('/api/admin/users')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load users')
      setUsers(json.users ?? [])
    } catch (err: any) {
      setUsersError(err.message ?? 'Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      const json = await res.json()
      if (res.ok) setStats(json)
    } catch (err) {
      console.error('Stats load error:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const loadMaintenance = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/maintenance')
      const json = await res.json()
      if (res.ok && json.config) {
        setMaintenance(json.config)
        setMaintenanceForm({
          enabled: json.config.enabled,
          message: json.config.message ?? '',
          expected_completion_hours: json.config.expected_completion_hours ?? 2,
          allow_admin_access: json.config.allow_admin_access ?? true,
        })
      }
    } catch (err) {
      console.error('Maintenance load error:', err)
    }
  }, [])

  const loadAnnouncement = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/announcement')
      const json = await res.json()
      if (res.ok && json.config) {
        setAnnouncement(json.config)
        setAnnouncementForm({
          enabled: json.config.enabled,
          message: json.config.message ?? '',
          type: json.config.type ?? 'info',
          dismissible: json.config.dismissible ?? true,
        })
      }
    } catch (err) {
      console.error('Announcement load error:', err)
    }
  }, [])

  // ============================================================
  // Initial load
  // ============================================================
  useEffect(() => {
    loadWhitelist()
    loadUsers()
    loadStats()
    loadMaintenance()
    loadAnnouncement()
  }, [loadWhitelist, loadUsers, loadStats, loadMaintenance, loadAnnouncement])

  // ============================================================
  // Whitelist handlers (existing, preserved)
  // ============================================================
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setSubmitting(true)
    setWhitelistError(null)
    try {
      await addToWhitelist({
        email: newEmail,
        full_name: newName,
        is_premium: newPremium,
        assigned_theme: newTheme || undefined,
        assigned_mascot: newMascot || undefined,
        notes: newNotes,
      })
      setNewEmail('')
      setNewName('')
      setNewPremium(false)
      setNewTheme('')
      setNewMascot('')
      setNewNotes('')
      await loadWhitelist()
    } catch (err: any) {
      setWhitelistError(err.message ?? 'Failed to add email')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(email: string) {
    if (!confirm(`Deactivate ${email}? User tidak akan bisa login lagi.`)) return
    try {
      await removeFromWhitelist(email)
      await loadWhitelist()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleReactivate(email: string) {
    try {
      await reactivateInWhitelist(email)
      await loadWhitelist()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDelete(email: string) {
    if (!confirm(`HAPUS PERMANEN ${email}? Tidak bisa di-undo.`)) return
    try {
      await deleteFromWhitelist(email)
      await loadWhitelist()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleGrantElephant(email: string) {
    if (!confirm(`Beri akses maskot Gajah ke ${email}? (Eksklusif)`)) return
    try {
      await grantMascotAccess('elephant', email)
      alert('✅ Akses gajah diberikan ke ' + email)
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  // ============================================================
  // Tier management handlers (new)
  // ============================================================
  async function handleChangeTier(userId: string, email: string) {
    const tier = prompt(
      `Set tier untuk ${email}:\n\nOptions: admin, vip, premium, basic, trial, expired, suspended\n(Enter tier name):`,
      'premium'
    )
    if (!tier) return

    const daysInput = prompt(
      `Subscription duration in days? (Enter number, or leave empty for no expiry)\n- 365 = 1 year\n- 30 = 1 month\n- empty = no expiry (admin/vip only)`,
      '365'
    )
    const days = daysInput && daysInput.trim() !== '' ? parseInt(daysInput, 10) : null

    const note = prompt(`Admin note (optional):`, 'Manual change via admin panel')

    try {
      const res = await fetch('/api/admin/users/tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier, days, note }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to change tier')
      alert(`✅ Tier updated!\n${email} → ${tier}\nExpiry: ${json.tier_expires_at ?? 'Never'}`)
      await loadUsers()
      await loadStats()
    } catch (err: any) {
      alert('❌ Error: ' + err.message)
    }
  }

  async function handleUpgradePremium(userId: string, email: string) {
    if (!confirm(`Upgrade ${email} to PREMIUM for 1 year (365 days)?`)) return
    try {
      const res = await fetch('/api/admin/users/upgrade-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, note: 'Manual upgrade via admin panel' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to upgrade')
      alert(`✅ ${email} upgraded to Premium!`)
      await loadUsers()
      await loadStats()
    } catch (err: any) {
      alert('❌ Error: ' + err.message)
    }
  }

  async function handleSuspend(userId: string, email: string) {
    const reason = prompt(`Suspend ${email}? Reason:`)
    if (!reason) return
    if (!confirm(`Confirm SUSPEND ${email}? User cannot login.`)) return
    try {
      const res = await fetch('/api/admin/users/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to suspend')
      alert(`✅ ${email} suspended.`)
      await loadUsers()
      await loadStats()
    } catch (err: any) {
      alert('❌ Error: ' + err.message)
    }
  }

  // ============================================================
  // Maintenance handlers
  // ============================================================
  async function handleSaveMaintenance() {
    setMaintenanceSaving(true)
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintenanceForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      alert(`✅ Maintenance mode ${maintenanceForm.enabled ? 'ENABLED' : 'DISABLED'}`)
      await loadMaintenance()
    } catch (err: any) {
      alert('❌ Error: ' + err.message)
    } finally {
      setMaintenanceSaving(false)
    }
  }

  // ============================================================
  // Announcement handlers
  // ============================================================
  async function handleSaveAnnouncement() {
    setAnnouncementSaving(true)
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      alert(`✅ Announcement ${announcementForm.enabled ? 'ENABLED' : 'DISABLED'}`)
      await loadAnnouncement()
    } catch (err: any) {
      alert('❌ Error: ' + err.message)
    } finally {
      setAnnouncementSaving(false)
    }
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-pink-950/40 backdrop-blur-[5px]">
      <div className="bg-white/95 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide drop-shadow">
              ⚙️ Admin Panel
            </h3>
            <p className="text-[11px] text-white/90 font-semibold mt-0.5">
              GDP Budgeting — User & Subscription Management
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-pink-200/60 bg-white/50 overflow-x-auto">
          {([
            { key: 'stats', label: '📊 Stats', short: '📊' },
            { key: 'users', label: '👥 Users', short: '👥' },
            { key: 'allowlist', label: '✉️ Whitelist', short: '✉️' },
            { key: 'maintenance', label: '🔧 Maintenance', short: '🔧' },
            { key: 'announcement', label: '📢 Banner', short: '📢' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition',
                activeTab === tab.key
                  ? 'text-pink-700 border-b-2 border-pink-500 bg-white'
                  : 'text-pink-700/60 hover:text-pink-700 hover:bg-pink-50/50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-4 py-4 flex-1">
          {/* ============================================================ */}
          {/* TAB: Stats                                                   */}
          {/* ============================================================ */}
          {activeTab === 'stats' && (
            <section className="space-y-4">
              <h4 className="text-xs font-bold text-pink-950 uppercase tracking-wider">
                📊 Statistics Overview
              </h4>

              {statsLoading ? (
                <p className="text-xs text-pink-700/60 text-center py-4">Loading stats...</p>
              ) : stats ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-3">
                      <p className="text-[10px] uppercase text-pink-700 font-bold">Total Users</p>
                      <p className="text-2xl font-bold text-pink-900 mt-1">{stats.total_users}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3">
                      <p className="text-[10px] uppercase text-emerald-700 font-bold">Premium+</p>
                      <p className="text-2xl font-bold text-emerald-900 mt-1">
                        {stats.premium_users}
                      </p>
                      <p className="text-[9px] text-emerald-600 mt-0.5">
                        {stats.premium_conversion_rate}% conversion
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-[10px] uppercase text-blue-700 font-bold">Trial Active</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">{stats.trial_active}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-[10px] uppercase text-amber-700 font-bold">
                        Trial Expired
                      </p>
                      <p className="text-2xl font-bold text-amber-900 mt-1">{stats.trial_expired}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-3">
                      <p className="text-[10px] uppercase text-red-700 font-bold">
                        Expired (Read-Only)
                      </p>
                      <p className="text-2xl font-bold text-red-900 mt-1">{stats.expired_users}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-200 rounded-xl p-3">
                      <p className="text-[10px] uppercase text-purple-700 font-bold">
                        Recent Signups (7d)
                      </p>
                      <p className="text-2xl font-bold text-purple-900 mt-1">
                        {stats.recent_signups_7d}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-pink-950 mt-4 mb-2">
                      Users by Tier
                    </h5>
                    <div className="space-y-1.5">
                      {Object.entries(stats.by_tier ?? {}).map(([tier, count]) => {
                        const info = TIER_INFO[tier as Tier]
                        if (!info) return null
                        return (
                          <div
                            key={tier}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 rounded-lg border',
                              info.color,
                              info.borderColor
                            )}
                          >
                            <span className={cn('text-xs font-bold', info.textColor)}>
                              {info.label}
                            </span>
                            <span className={cn('text-xs font-bold', info.textColor)}>
                              {count as number} user{(count as number) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-pink-700/60 text-center py-4">
                  Failed to load stats
                </p>
              )}
            </section>
          )}

          {/* ============================================================ */}
          {/* TAB: Users                                                    */}
          {/* ============================================================ */}
          {activeTab === 'users' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-pink-950 uppercase tracking-wider">
                  👥 User Management ({users.length})
                </h4>
                <button
                  onClick={loadUsers}
                  className="text-[10px] text-pink-700 hover:text-pink-900 font-semibold underline"
                >
                  ↻ Refresh
                </button>
              </div>

              {usersLoading && (
                <p className="text-xs text-pink-700/60 text-center py-8">Loading users...</p>
              )}

              {usersError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
                  ❌ {usersError}
                  <button
                    onClick={loadUsers}
                    className="mt-1 block text-rose-900 font-bold underline"
                  >
                    Coba lagi
                  </button>
                </div>
              )}

              {!usersLoading && !usersError && users.length === 0 && (
                <p className="text-xs text-pink-700/60 italic text-center py-4">
                  No users found
                </p>
              )}

              {!usersLoading && !usersError && users.map((u) => {
                const info = TIER_INFO[u.tier]
                return (
                  <div
                    key={u.user_id}
                    className={cn(
                      'p-3 rounded-xl border-2',
                      info.color,
                      info.borderColor
                    )}
                  >
                    {/* Header: email + tier badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-pink-950 truncate">
                            {u.email}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                              info.color,
                              info.textColor
                            )}
                          >
                            {info.label}
                          </span>
                          {u.is_admin && (
                            <span className="text-[9px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded-full font-bold">
                              👑 ADMIN
                            </span>
                          )}
                        </div>
                        {u.full_name && (
                          <p className="text-[10px] text-pink-700/70 mt-0.5">{u.full_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Subscription info */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2 text-[10px]">
                      <div>
                        <p className="text-pink-700/60 uppercase font-semibold">Expiry</p>
                        <p className="text-pink-950 font-bold">
                          {formatExpiry(u.tier_expires_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-pink-700/60 uppercase font-semibold">Days Left</p>
                        <p className="text-pink-950 font-bold">
                          {formatDays(u.days_until_expiry)}
                        </p>
                      </div>
                      <div>
                        <p className="text-pink-700/60 uppercase font-semibold">Tx Count</p>
                        <p className="text-pink-950 font-bold">{u.transaction_count}</p>
                      </div>
                    </div>

                    {/* Trial info */}
                    {u.tier === 'trial' && u.trial_days_remaining !== null && (
                      <p className="text-[10px] text-blue-700 font-semibold mt-1">
                        🎁 Trial: {u.trial_days_remaining} day(s) remaining
                      </p>
                    )}

                    {/* Subscription note */}
                    {u.subscription_note && (
                      <p className="text-[10px] text-pink-700/60 italic mt-1">
                        📝 {u.subscription_note}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <button
                        onClick={() => handleChangeTier(u.user_id, u.email)}
                        className="text-[9px] bg-pink-100 hover:bg-pink-200 text-pink-900 px-2 py-1 rounded font-semibold"
                      >
                        🔄 Change Tier
                      </button>
                      <button
                        onClick={() => handleUpgradePremium(u.user_id, u.email)}
                        disabled={u.tier === 'premium' || u.tier === 'vip' || u.is_admin}
                        className="text-[9px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-2 py-1 rounded font-semibold disabled:opacity-40"
                      >
                        ⭐ Upgrade Premium
                      </button>
                      {u.tier !== 'suspended' ? (
                        <button
                          onClick={() => handleSuspend(u.user_id, u.email)}
                          className="text-[9px] bg-red-100 hover:bg-red-200 text-red-900 px-2 py-1 rounded font-semibold"
                        >
                          🚫 Suspend
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </section>
          )}

          {/* ============================================================ */}
          {/* TAB: Allowlist (existing, preserved)                        */}
          {/* ============================================================ */}
          {activeTab === 'allowlist' && (
            <section className="space-y-3">
              <h4 className="text-xs font-bold text-pink-950 uppercase tracking-wider">
                ✉️ Email Whitelist ({whitelist.length})
              </h4>

              {whitelistLoading && (
                <p className="text-center text-xs text-pink-800/60 py-8">Memuat whitelist...</p>
              )}

              {whitelistError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
                  ❌ {whitelistError}
                  <button
                    onClick={loadWhitelist}
                    className="mt-1 block text-rose-900 font-bold underline"
                  >
                    Coba lagi
                  </button>
                </div>
              )}

              {/* Add new whitelist form */}
              <form onSubmit={handleAdd} className="space-y-2 bg-pink-50/50 p-3 rounded-xl">
                <p className="text-xs font-bold text-pink-950 uppercase tracking-wider">
                  ➕ Tambah Email
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="email@gmail.com *"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="bg-white/80 border border-pink-200 rounded-lg px-3 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Nama lengkap"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-white/80 border border-pink-200 rounded-lg px-3 py-1.5 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value)}
                    className="bg-white/80 border border-pink-200 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <option value="">Auto-assign tema</option>
                    <option value="elephant-pink">🐘 Elephant Pink</option>
                    <option value="forest-sage">🌿 Forest Sage</option>
                    <option value="moon-lavender">🌙 Moon Lavender</option>
                    <option value="rose-gold-luxe">🌸 Rose Gold Luxe ⭐</option>
                    <option value="cherry-blossom">🍒 Cherry Blossom ⭐</option>
                    <option value="lavender-dream">💜 Lavender Dream ⭐</option>
                    <option value="sunset-coral">🌅 Sunset Coral ⭐</option>
                    <option value="pearl-blush">🤍 Pearl Blush ⭐</option>
                  </select>
                  <select
                    value={newMascot}
                    onChange={(e) => setNewMascot(e.target.value)}
                    className="bg-white/80 border border-pink-200 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <option value="">Auto-assign maskot</option>
                    <option value="cat">🐱 Cat</option>
                    <option value="butterfly">🦋 Butterfly</option>
                    <option value="rabbit">🐰 Rabbit</option>
                    <option value="fox">🦊 Fox</option>
                    <option value="panda">🐼 Panda</option>
                    <option value="moon">🌙 Moon</option>
                    <option value="unicorn">🦄 Unicorn ⭐</option>
                    <option value="sakura">🌸 Sakura ⭐</option>
                    <option value="star">⭐ Star ⭐</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Catatan (mis. 'Customer VIP - bayar 250K')"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-white/80 border border-pink-200 rounded-lg px-3 py-1.5 text-xs"
                />
                <label className="flex items-center gap-2 text-xs text-pink-900">
                  <input
                    type="checkbox"
                    checked={newPremium}
                    onChange={(e) => setNewPremium(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Premium user (akses tema & maskot premium)
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 text-white font-semibold py-2 px-3 rounded-lg text-xs"
                >
                  {submitting ? '⏳ Menambahkan...' : '➕ Tambah ke Whitelist'}
                </button>
              </form>

              {/* Existing whitelist entries */}
              <div className="space-y-2">
                {whitelist.map((entry) => (
                  <div
                    key={entry.email}
                    className={cn(
                      'p-3 rounded-xl border-2',
                      entry.is_active
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-gray-100 border-gray-300 opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-pink-950 truncate">
                            {entry.email}
                          </span>
                          {entry.is_premium && (
                            <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">
                              ⭐ Premium
                            </span>
                          )}
                          {!entry.is_active && (
                            <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded-full font-bold">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        {entry.full_name && (
                          <p className="text-[10px] text-pink-700/70 mt-0.5">{entry.full_name}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {entry.assigned_theme && (
                            <span className="text-[9px] bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded">
                              🎨 {entry.assigned_theme}
                            </span>
                          )}
                          {entry.assigned_mascot && (
                            <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                              🐾 {entry.assigned_mascot}
                            </span>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-[10px] text-pink-700/60 italic mt-1">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.is_active ? (
                        <button
                          onClick={() => handleDeactivate(entry.email)}
                          className="text-[9px] bg-rose-100 hover:bg-rose-200 text-rose-900 px-2 py-1 rounded font-semibold"
                        >
                          🚫 Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(entry.email)}
                          className="text-[9px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-2 py-1 rounded font-semibold"
                        >
                          ✓ Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleGrantElephant(entry.email)}
                        className="text-[9px] bg-purple-100 hover:bg-purple-200 text-purple-900 px-2 py-1 rounded font-semibold"
                      >
                        🐘 Grant Elephant
                      </button>
                      <button
                        onClick={() => handleDelete(entry.email)}
                        className="text-[9px] bg-red-200 hover:bg-red-300 text-red-900 px-2 py-1 rounded font-semibold"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ============================================================ */}
          {/* TAB: Maintenance                                              */}
          {/* ============================================================ */}
          {activeTab === 'maintenance' && (
            <section className="space-y-3">
              <h4 className="text-xs font-bold text-pink-950 uppercase tracking-wider">
                🔧 Maintenance Mode
              </h4>

              {maintenance && (
                <div
                  className={cn(
                    'p-3 rounded-xl border-2',
                    maintenance.enabled
                      ? 'bg-red-50 border-red-300'
                      : 'bg-emerald-50 border-emerald-200'
                  )}
                >
                  <p className="text-[10px] uppercase font-bold opacity-70">Current Status</p>
                  <p className="text-sm font-bold mt-0.5">
                    {maintenance.enabled ? '🔴 ON (App blocked)' : '🟢 OFF (Normal)'}
                  </p>
                  {maintenance.started_at && (
                    <p className="text-[10px] opacity-70 mt-0.5">
                      Started: {new Date(maintenance.started_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3 bg-pink-50/50 p-3 rounded-xl">
                {/* Toggle */}
                <label className="flex items-center gap-2 text-xs font-bold text-pink-950">
                  <input
                    type="checkbox"
                    checked={maintenanceForm.enabled}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, enabled: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  Enable maintenance mode
                </label>

                {/* Message */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-pink-700 block mb-1">
                    Message (shown to users)
                  </label>
                  <textarea
                    value={maintenanceForm.message}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, message: e.target.value })
                    }
                    placeholder="We're upgrading GDP Budgeting to serve you better. Expected completion: 2 hours."
                    rows={3}
                    className="w-full bg-white/80 border border-pink-200 rounded-lg px-3 py-1.5 text-xs"
                  />
                </div>

                {/* Expected completion */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-pink-700 block mb-1">
                    Expected completion (hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={48}
                    value={maintenanceForm.expected_completion_hours}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        expected_completion_hours: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-24 bg-white/80 border border-pink-200 rounded-lg px-3 py-1.5 text-xs"
                  />
                </div>

                {/* Allow admin access */}
                <label className="flex items-center gap-2 text-xs text-pink-900">
                  <input
                    type="checkbox"
                    checked={maintenanceForm.allow_admin_access}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        allow_admin_access: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  Allow admin to access app during maintenance
                </label>

                {/* Save button */}
                <button
                  onClick={handleSaveMaintenance}
                  disabled={maintenanceSaving}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-60 text-white font-bold py-2 px-3 rounded-lg text-xs"
                >
                  {maintenanceSaving
                    ? '⏳ Saving...'
                    : maintenanceForm.enabled
                    ? '🔴 Enable Maintenance'
                    : '🟢 Disable Maintenance'}
                </button>
              </div>

              <p className="text-[10px] text-pink-700/60 italic">
                ⚠️ When enabled, all non-admin users will see a maintenance modal and cannot
                access the app. Admin (you) can still login.
              </p>
            </section>
          )}

          {/* ============================================================ */}
          {/* TAB: Announcement                                            */}
          {/* ============================================================ */}
          {activeTab === 'announcement' && (
            <section className="space-y-3">
              <h4 className="text-xs font-bold text-pink-950 uppercase tracking-wider">
                📢 Announcement Banner
              </h4>

              {announcement && (
                <div
                  className={cn(
                    'p-3 rounded-xl border-2',
                    announcement.enabled
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-100 border-gray-300'
                  )}
                >
                  <p className="text-[10px] uppercase font-bold opacity-70">Current Status</p>
                  <p className="text-sm font-bold mt-0.5">
                    {announcement.enabled ? '📢 Banner Active' : '⚪ No banner'}
                  </p>
                  {announcement.message && (
                    <p className="text-xs text-pink-800 mt-1 italic">
                      &ldquo;{announcement.message}&rdquo;
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3 bg-pink-50/50 p-3 rounded-xl">
                <label className="flex items-center gap-2 text-xs font-bold text-pink-950">
                  <input
                    type="checkbox"
                    checked={announcementForm.enabled}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, enabled: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  Show announcement banner
                </label>

                <div>
                  <label className="text-[10px] uppercase font-bold text-pink-700 block mb-1">
                    Banner message
                  </label>
                  <textarea
                    value={announcementForm.message}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, message: e.target.value })
                    }
                    placeholder="🎉 New feature: Couple Budgeting! Share your budget with your partner."
                    rows={2}
                    className="w-full bg-white/80 border border-pink-200 rounded-lg px-3 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-pink-700 block mb-1">
                    Type
                  </label>
                  <div className="flex gap-2">
                    {(['info', 'warning', 'success'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAnnouncementForm({ ...announcementForm, type: t })}
                        className={cn(
                          'text-xs px-3 py-1 rounded font-semibold border',
                          announcementForm.type === t
                            ? t === 'info'
                              ? 'bg-blue-100 text-blue-900 border-blue-400'
                              : t === 'warning'
                              ? 'bg-amber-100 text-amber-900 border-amber-400'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-400'
                            : 'bg-white/50 text-pink-700 border-pink-200'
                        )}
                      >
                        {t === 'info' ? 'ℹ️ Info' : t === 'warning' ? '⚠️ Warning' : '✅ Success'}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-pink-900">
                  <input
                    type="checkbox"
                    checked={announcementForm.dismissible}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, dismissible: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  Dismissible (user can close)
                </label>

                <button
                  onClick={handleSaveAnnouncement}
                  disabled={announcementSaving}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-60 text-white font-bold py-2 px-3 rounded-lg text-xs"
                >
                  {announcementSaving
                    ? '⏳ Saving...'
                    : announcementForm.enabled
                    ? '📢 Show Banner'
                    : '🚫 Hide Banner'}
                </button>
              </div>

              <p className="text-[10px] text-pink-700/60 italic">
                ℹ️ Banner appears at top of dashboard for all logged-in users.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
