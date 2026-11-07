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
import { TIER_INFO, type Tier } from '@/lib/constants/tiers'
import ChangeTierModal from '@/components/change-tier-modal'
import SuspendUserModal from '@/components/suspend-user-modal'

type AllowedEmail = Database['public']['Tables']['allowed_emails']['Row']

// ============================================================
// Types
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

type TabKey = 'stats' | 'users' | 'allowlist' | 'maintenance' | 'banner'

interface Props {
  adminEmail: string
  adminName: string
}

// WhatsApp constants
const WA_NUMBER = '6281575859792'

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
  if (days === 0) return 'Today'
  return `${days}d`
}

function formatLastSeen(isoTimestamp: string | null): string {
  if (!isoTimestamp) return 'Never'
  const date = new Date(isoTimestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 30) {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  }
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  return 'Just now'
}

// ============================================================
// Main component
// ============================================================
export default function AdminPanel({ adminEmail, adminName }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('stats')

  // Whitelist state
  const [whitelist, setWhitelist] = useState<AllowedEmail[]>([])
  const [whitelistLoading, setWhitelistLoading] = useState(true)
  const [whitelistSearch, setWhitelistSearch] = useState('')  // Sprint 8: search filter
  const [whitelistError, setWhitelistError] = useState<string | null>(null)

  // Form state for whitelist (removed Nama Lengkap)
  const [newEmail, setNewEmail] = useState('')
  const [newPremium, setNewPremium] = useState(false)
  const [newTheme, setNewTheme] = useState('')
  const [newMascot, setNewMascot] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')  // Sprint 8: search filter
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

  // Modal states
  const [changeTierUser, setChangeTierUser] = useState<AdminUser | null>(null)
  const [suspendUser, setSuspendUser] = useState<AdminUser | null>(null)

  // ============================================================
  // Loaders
  // ============================================================
  const loadWhitelist = useCallback(async () => {
    setWhitelistLoading(true)
    setWhitelistError(null)
    try {
      const res = await fetch('/api/admin/whitelist')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load whitelist')
      setWhitelist(json.whitelist ?? [])
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

  useEffect(() => {
    loadWhitelist()
    loadUsers()
    loadStats()
    loadMaintenance()
    loadAnnouncement()
  }, [loadWhitelist, loadUsers, loadStats, loadMaintenance, loadAnnouncement])

  // ============================================================
  // Whitelist handlers (removed Nama Lengkap field)
  // ============================================================
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setSubmitting(true)
    setWhitelistError(null)
    try {
      const res = await fetch('/api/admin/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          is_premium: newPremium,
          assigned_theme: newTheme || undefined,
          assigned_mascot: newMascot || undefined,
          notes: newNotes,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to add email')
      setNewEmail('')
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
      const res = await fetch('/api/admin/whitelist/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      await loadWhitelist()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleReactivate(email: string) {
    try {
      const res = await fetch('/api/admin/whitelist/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      await loadWhitelist()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDelete(email: string) {
    if (!confirm(`HAPUS PERMANEN ${email}? Tidak bisa di-undo.`)) return
    try {
      const res = await fetch('/api/admin/whitelist/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      await loadWhitelist()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleGrantElephant(email: string) {
    if (!confirm(`Beri akses maskot Gajah ke ${email}? (Eksklusif)`)) return
    try {
      const res = await fetch('/api/admin/whitelist/grant-mascot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mascotId: 'elephant' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      alert('✅ Akses gajah diberikan ke ' + email + '. User perlu logout & login lagi untuk melihat perubahan.')
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  // ============================================================
  // Tier management handlers (using modals)
  // ============================================================
  async function handleChangeTierConfirm(
    tier: Tier,
    days: number | null,
    note: string | null
  ) {
    if (!changeTierUser) return
    try {
      const res = await fetch('/api/admin/users/tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: changeTierUser.user_id,
          tier,
          days,
          note,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to change tier')
      alert(`✅ Tier updated!\n${changeTierUser.email} → ${tier}`)
      await loadUsers()
      await loadStats()
    } catch (err: any) {
      throw new Error(err.message ?? 'Failed to change tier')
    }
  }

  async function handleSuspendConfirm(reason: string, customNote: string) {
    if (!suspendUser) return
    const fullReason = reason === 'Other' && customNote ? customNote : reason
    try {
      const res = await fetch('/api/admin/users/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: suspendUser.user_id,
          reason: fullReason,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to suspend')
      alert(`✅ ${suspendUser.email} suspended.\nReason: ${fullReason}`)
      await loadUsers()
      await loadStats()
    } catch (err: any) {
      throw new Error(err.message ?? 'Failed to suspend user')
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

  // ============================================================
  // Maintenance & Announcement handlers
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
              ⚙️
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100">GDP Admin Panel</h1>
              <p className="text-[10px] text-slate-400">
                {adminName} · {adminEmail}
              </p>
            </div>
          </div>
          <a
            href="/"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/50"
          >
            ← Kembali ke App
          </a>
        </div>
      </header>

      <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
        {/* Sidebar (desktop) / Top tabs (mobile) */}
        <aside className="md:w-56 md:min-h-[calc(100vh-65px)] md:border-r border-slate-800 md:sticky md:top-[65px]">
          <nav className="flex md:flex-col gap-1 p-3 overflow-x-auto md:overflow-visible">
            {([
              { key: 'stats', label: 'Statistik', icon: '📊', short: '📊' },
              { key: 'users', label: 'Pengguna', icon: '👥', short: '👥' },
              { key: 'allowlist', label: 'Whitelist', icon: '✉️', short: '✉️' },
              { key: 'maintenance', label: 'Maintenance', icon: '🔧', short: '🔧' },
              { key: 'banner', label: 'Pengumuman', icon: '📢', short: '📢' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition',
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">
          {/* ============================================================ */}
          {/* TAB: Stats                                                   */}
          {/* ============================================================ */}
          {activeTab === 'stats' && (
            <section className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Statistik Overview</h2>
                <p className="text-xs text-slate-400 mt-1">Ringkasan pengguna & konversi subscription</p>
              </div>

              {statsLoading ? (
                <p className="text-sm text-slate-400 text-center py-8">Loading stats...</p>
              ) : stats ? (
                <>
                  {/* KPI cards grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <KpiCard
                      label="Total Users"
                      value={stats.total_users}
                      icon="👥"
                      color="from-cyan-500/20 to-blue-500/20 border-cyan-500/30"
                      textColor="text-cyan-300"
                    />
                    <KpiCard
                      label="Premium+"
                      value={stats.premium_users}
                      subtitle={`${stats.premium_conversion_rate}% conversion`}
                      icon="💎"
                      color="from-emerald-500/20 to-teal-500/20 border-emerald-500/30"
                      textColor="text-emerald-300"
                    />
                    <KpiCard
                      label="Trial Active"
                      value={stats.trial_active}
                      icon="🎁"
                      color="from-blue-500/20 to-sky-500/20 border-blue-500/30"
                      textColor="text-blue-300"
                    />
                    <KpiCard
                      label="Trial Expired"
                      value={stats.trial_expired}
                      icon="⏰"
                      color="from-amber-500/20 to-yellow-500/20 border-amber-500/30"
                      textColor="text-amber-300"
                    />
                    <KpiCard
                      label="Expired (Read-Only)"
                      value={stats.expired_users}
                      icon="⚠️"
                      color="from-red-500/20 to-rose-500/20 border-red-500/30"
                      textColor="text-red-300"
                    />
                    <KpiCard
                      label="Recent Signups (7d)"
                      value={stats.recent_signups_7d}
                      icon="📈"
                      color="from-purple-500/20 to-fuchsia-500/20 border-purple-500/30"
                      textColor="text-purple-300"
                    />
                  </div>

                  {/* By tier breakdown */}
                  <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Pengguna per Tier
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(stats.by_tier ?? {}).map(([tier, count]) => {
                        const info = TIER_INFO[tier as Tier]
                        if (!info) return null
                        return (
                          <div
                            key={tier}
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700"
                          >
                            <span className="text-sm font-semibold text-slate-200">
                              {info.label}
                            </span>
                            <span className="text-sm font-bold text-slate-100">
                              {count as number} user{(count as number) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Failed to load stats</p>
              )}
            </section>
          )}

          {/* ============================================================ */}
          {/* TAB: Users                                                   */}
          {/* ============================================================ */}
          {activeTab === 'users' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Manajemen Pengguna</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {filteredUsers.length} dari {users.length} pengguna terdaftar
                  </p>
                </div>
                <button
                  onClick={loadUsers}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition"
                >
                  ↻ Refresh
                </button>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="🔍 Cari email atau nama..."
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none w-48"
                />
              </div>

              {usersLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-3" />
                  <p className="text-sm text-slate-400">Loading users...</p>
                </div>
              )}

              {usersError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">
                  ❌ {usersError}
                  <button
                    onClick={loadUsers}
                    className="mt-1 block text-red-200 font-bold underline"
                  >
                    Coba lagi
                  </button>
                </div>
              )}

              {!usersLoading && !usersError && users.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-8">
                  No users found
                </p>
              )}

              {/* User cards */}
              <div className="grid gap-3">
                {!usersLoading && !usersError && users.map((u) => {
                  const info = TIER_INFO[u.tier]
                  return (
                    <div
                      key={u.user_id}
                      className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition"
                    >
                      {/* Header: email + tier badge */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-100 truncate">
                              {u.email}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full font-bold border',
                                u.tier === 'deleted'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : cn(info.color, info.textColor, info.borderColor)
                              )}
                            >
                              {u.tier === 'deleted' ? '🗑️ DELETED' : info.label}
                            </span>
                            {u.is_admin && (
                              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold border border-purple-500/30">
                                👑 ADMIN
                              </span>
                            )}
                          </div>
                          {u.full_name && (
                            <p className="text-xs text-slate-400 mt-1">{u.full_name}</p>
                          )}
                        </div>
                      </div>

                      {/* Subscription info */}
                      <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Expiry</p>
                          <p className="text-slate-200 font-bold">{formatExpiry(u.tier_expires_at)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Days Left</p>
                          <p className="text-slate-200 font-bold">{formatDays(u.days_until_expiry)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Tx Count</p>
                          <p className="text-slate-200 font-bold">{u.transaction_count}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Last Seen</p>
                          <p className="text-slate-200 font-bold">{formatLastSeen(u.last_sign_in_at)}</p>
                        </div>
                      </div>

                      {/* Trial info */}
                      {u.tier === 'trial' && u.trial_days_remaining !== null && (
                        <p className="text-xs text-blue-300 font-semibold mb-2">
                          🎁 Trial: {u.trial_days_remaining} day(s) remaining
                        </p>
                      )}

                      {/* Subscription note */}
                      {u.subscription_note && (
                        <p className="text-[11px] text-slate-400 italic mb-3 bg-slate-800/50 rounded-lg px-2 py-1">
                          📝 {u.subscription_note}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {u.tier !== 'deleted' && (
                          <>
                            <button
                              onClick={() => setChangeTierUser(u)}
                              className="text-[11px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-3 py-1.5 rounded-lg font-semibold border border-cyan-500/30 transition"
                            >
                              🔄 Change Tier
                            </button>
                            <button
                              onClick={() => handleUpgradePremium(u.user_id, u.email)}
                              disabled={u.tier === 'premium' || u.tier === 'vip' || u.is_admin}
                              className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg font-semibold border border-emerald-500/30 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              ⭐ Upgrade Premium
                            </button>
                          </>
                        )}
                        {u.tier !== 'suspended' && !u.is_admin && u.tier !== 'deleted' && (
                          <button
                            onClick={() => setSuspendUser(u)}
                            className="text-[11px] bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg font-semibold border border-red-500/30 transition"
                          >
                            🚫 Suspend
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ============================================================ */}
          {/* TAB: Whitelist                                              */}
          {/* ============================================================ */}
          {activeTab === 'allowlist' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Email Whitelist</h2>
                <p className="text-xs text-slate-400 mt-1">
                  {filteredWhitelist.length} dari {whitelist.length} email terdaftar · Kontrol siapa yang bisa register
                </p>
              </div>
              <input
                type="text"
                value={whitelistSearch}
                onChange={(e) => setWhitelistSearch(e.target.value)}
                placeholder="🔍 Cari email atau catatan..."
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none w-full"
              />

              {whitelistLoading && (
                <p className="text-sm text-slate-400 text-center py-8">Loading whitelist...</p>
              )}

              {whitelistError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">
                  ❌ {whitelistError}
                  <button
                    onClick={loadWhitelist}
                    className="mt-1 block text-red-200 font-bold underline"
                  >
                    Coba lagi
                  </button>
                </div>
              )}

              {/* Add new whitelist form (removed Nama Lengkap) */}
              <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  ➕ Tambah Email ke Whitelist
                </h3>
                <form onSubmit={handleAdd} className="space-y-3">
                  <input
                    type="email"
                    placeholder="email@gmail.com *"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newTheme}
                      onChange={(e) => setNewTheme(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">Auto-assign tema</option>
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
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">Auto-assign maskot</option>
                      <option value="cat">🐱 Cat</option>
                      <option value="butterfly">🦋 Butterfly</option>
                      <option value="rabbit">🐰 Rabbit</option>
                      <option value="fox">🦊 Fox</option>
                      <option value="panda">🐼 Panda</option>
                      <option value="owl">🦉 Owl</option>
                      <option value="unicorn">🦄 Unicorn ⭐</option>
                      <option value="bear">🐻 Bear ⭐</option>
                      <option value="dog">🐶 Dog ⭐</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Catatan (mis. 'Customer VIP - bayar 250K')"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPremium}
                      onChange={(e) => setNewPremium(e.target.checked)}
                      className="w-4 h-4 accent-cyan-500"
                    />
                    Premium user (akses tema & maskot premium)
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-60 text-white font-bold py-2.5 px-3 rounded-xl text-sm transition"
                  >
                    {submitting ? '⏳ Menambahkan...' : '➕ Tambah ke Whitelist'}
                  </button>
                </form>
              </div>

              {/* Existing whitelist entries */}
              <div className="grid gap-2">
                {filteredWhitelist.map((entry) => (
                  <div
                    key={entry.email}
                    className={cn(
                      'p-3 rounded-xl border bg-slate-900/60 backdrop-blur-sm',
                      entry.is_active
                        ? 'border-slate-700'
                        : 'border-slate-800 opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-100 truncate">
                            {entry.email}
                          </span>
                          {entry.is_premium && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                              ⭐ Premium
                            </span>
                          )}
                          {!entry.is_active && (
                            <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-500/30">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {entry.assigned_theme && (
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                              🎨 {entry.assigned_theme}
                            </span>
                          )}
                          {entry.assigned_mascot && (
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                              🐾 {entry.assigned_mascot}
                            </span>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-[11px] text-slate-400 italic mt-1">{entry.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entry.is_active ? (
                        <button
                          onClick={() => handleDeactivate(entry.email)}
                          className="text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 py-1 rounded-lg font-semibold border border-red-500/30 transition"
                        >
                          🚫 Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(entry.email)}
                          className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-1 rounded-lg font-semibold border border-emerald-500/30 transition"
                        >
                          ✓ Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleGrantElephant(entry.email)}
                        className="text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-1 rounded-lg font-semibold border border-purple-500/30 transition"
                      >
                        🐘 Grant Elephant
                      </button>
                      <button
                        onClick={() => handleDelete(entry.email)}
                        className="text-[10px] bg-slate-700 hover:bg-red-500/30 text-slate-300 hover:text-red-300 px-2 py-1 rounded-lg font-semibold border border-slate-600 hover:border-red-500/30 transition"
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
          {/* TAB: Maintenance                                             */}
          {/* ============================================================ */}
          {activeTab === 'maintenance' && (
            <section className="space-y-4 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Maintenance Mode</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Block akses aplikasi untuk non-admin user
                </p>
              </div>

              {maintenance && (
                <div
                  className={cn(
                    'p-4 rounded-2xl border-2',
                    maintenance.enabled
                      ? 'bg-red-500/10 border-red-500/40'
                      : 'bg-emerald-500/10 border-emerald-500/40'
                  )}
                >
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Status Saat Ini
                  </p>
                  <p className="text-base font-bold mt-1">
                    {maintenance.enabled ? '🔴 ON (App blocked)' : '🟢 OFF (Normal)'}
                  </p>
                  {maintenance.started_at && (
                    <p className="text-xs text-slate-400 mt-1">
                      Started: {new Date(maintenance.started_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={maintenanceForm.enabled}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, enabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-cyan-500"
                  />
                  Enable maintenance mode
                </label>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Pesan untuk User
                  </label>
                  <textarea
                    value={maintenanceForm.message}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, message: e.target.value })
                    }
                    placeholder="Kami sedang melakukan maintenance untuk meningkatkan layanan. Estimasi selesai: 2 jam."
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Estimasi selesai (jam)
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
                    className="w-24 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={maintenanceForm.allow_admin_access}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        allow_admin_access: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-cyan-500"
                  />
                  Allow admin tetap akses app selama maintenance
                </label>

                <button
                  onClick={handleSaveMaintenance}
                  disabled={maintenanceSaving}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-60 text-white font-bold py-2.5 px-3 rounded-xl text-sm transition"
                >
                  {maintenanceSaving
                    ? '⏳ Saving...'
                    : maintenanceForm.enabled
                    ? '🔴 Enable Maintenance'
                    : '🟢 Disable Maintenance'}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                ⚠️ Saat enabled, semua non-admin user akan melihat modal maintenance dan tidak
                bisa akses app. Admin (Anda) tetap bisa login.
              </p>
            </section>
          )}

          {/* ============================================================ */}
          {/* TAB: Banner (Announcement)                                  */}
          {/* ============================================================ */}
          {activeTab === 'banner' && (
            <section className="space-y-4 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Pengumuman Banner</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tampilkan pengumuman ke semua user (modal popup)
                </p>
              </div>

              {announcement && (
                <div
                  className={cn(
                    'p-4 rounded-2xl border-2',
                    announcement.enabled
                      ? 'bg-cyan-500/10 border-cyan-500/40'
                      : 'bg-slate-800/50 border-slate-700'
                  )}
                >
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Status Saat Ini
                  </p>
                  <p className="text-base font-bold mt-1">
                    {announcement.enabled ? '📢 Banner Aktif' : '⚪ Tidak ada banner'}
                  </p>
                  {announcement.message && (
                    <p className="text-xs text-slate-300 mt-2 italic bg-slate-800/50 rounded-lg px-2 py-1">
                      &ldquo;{announcement.message}&rdquo;
                    </p>
                  )}
                </div>
              )}

              <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={announcementForm.enabled}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, enabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-cyan-500"
                  />
                  Tampilkan pengumuman ke user
                </label>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Pesan Pengumuman
                  </label>
                  <textarea
                    value={announcementForm.message}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, message: e.target.value })
                    }
                    placeholder="🎉 Fitur baru: Couple Budgeting! Sekarang Anda bisa share data dengan pasangan."
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                    Tipe Pengumuman
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['info', 'warning', 'success'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAnnouncementForm({ ...announcementForm, type: t })}
                        className={cn(
                          'text-xs px-2 py-2 rounded-lg font-semibold border transition',
                          announcementForm.type === t
                            ? t === 'info'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : t === 'warning'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                        )}
                      >
                        {t === 'info' ? 'ℹ️ Info' : t === 'warning' ? '⚠️ Warning' : '✅ Success'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live preview */}
                {announcementForm.message && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                      Preview (User akan lihat ini)
                    </label>
                    <div
                      className={cn(
                        'rounded-xl p-3 border-2',
                        announcementForm.type === 'info'
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : announcementForm.type === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-emerald-500/10 border-emerald-500/30'
                      )}
                    >
                      <p className="text-sm text-slate-100">
                        {announcementForm.type === 'info' ? 'ℹ️' : announcementForm.type === 'warning' ? '⚠️' : '✅'} {announcementForm.message}
                      </p>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={announcementForm.dismissible}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, dismissible: e.target.checked })
                    }
                    className="w-4 h-4 accent-cyan-500"
                  />
                  User bisa dismiss (klik OK)
                </label>

                <button
                  onClick={handleSaveAnnouncement}
                  disabled={announcementSaving}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-60 text-white font-bold py-2.5 px-3 rounded-xl text-sm transition"
                >
                  {announcementSaving
                    ? '⏳ Saving...'
                    : announcementForm.enabled
                    ? '📢 Publish Announcement'
                    : '🚫 Hide Announcement'}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                ℹ️ Saat enabled, semua user akan melihat modal popup pengumuman saat buka app.
                User harus klik "OK, Mengerti" untuk lanjut.
              </p>
            </section>
          )}
        </main>
      </div>

      {/* ============================================================ */}
      {/* MODALS                                                       */}
      {/* ============================================================ */}
      {changeTierUser && (
        <ChangeTierModal
          open={!!changeTierUser}
          user={changeTierUser}
          onClose={() => setChangeTierUser(null)}
          onConfirm={handleChangeTierConfirm}
        />
      )}

      {suspendUser && (
        <SuspendUserModal
          open={!!suspendUser}
          user={suspendUser}
          onClose={() => setSuspendUser(null)}
          onConfirm={handleSuspendConfirm}
        />
      )}
    </div>
  )
}

// ============================================================
// Sub-component: KPI Card
// ============================================================
function KpiCard({
  label,
  value,
  subtitle,
  icon,
  color,
  textColor,
}: {
  label: string
  value: number
  subtitle?: string
  icon: string
  color: string
  textColor: string
}) {
  return (
    <div className={cn('rounded-2xl p-4 border bg-gradient-to-br', color)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
          {label}
        </p>
        <span className="text-base">{icon}</span>
      </div>
      <p className={cn('text-2xl font-bold', textColor)}>{value}</p>
      {subtitle && <p className="text-[10px] text-slate-500 mt-1">{subtitle}</p>}
    </div>
  )
}
