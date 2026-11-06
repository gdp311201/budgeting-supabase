'use client'

import { useState } from 'react'
import type { Tier } from '@/lib/constants/tiers'
import { TIER_INFO, PRICING } from '@/lib/constants/tiers'

interface AdminUser {
  user_id: string
  email: string
  full_name: string | null
  tier: Tier
  tier_expires_at: string | null
}

interface Props {
  open: boolean
  user: AdminUser
  onClose: () => void
  onConfirm: (tier: Tier, days: number | null, note: string | null) => Promise<void>
}

const TIER_OPTIONS: { value: Tier; label: string; description: string }[] = [
  { value: 'admin', label: '👑 Admin', description: 'Super admin — full access, no expiry' },
  { value: 'vip', label: '⭐ VIP', description: 'VIP member — exclusive mascot, no expiry' },
  { value: 'premium', label: '💎 Premium', description: `Premium tier — Rp ${PRICING.premium_annual.toLocaleString('id-ID')}/year` },
  { value: 'basic', label: '👤 Basic', description: `Basic tier — Rp ${PRICING.basic_annual.toLocaleString('id-ID')}/year` },
  { value: 'trial', label: '🎁 Trial', description: 'Premium trial — auto-downgrade after 3 days' },
  { value: 'expired', label: '⚠️ Expired', description: 'Subscription expired — read-only mode' },
  { value: 'suspended', label: '🚫 Suspended', description: 'Account suspended — cannot login' },
]

/**
 * ChangeTierModal — dropdown UI for changing user tier
 *
 * Replaces the old prompt()-based approach (which was buggy & error-prone).
 */
export default function ChangeTierModal({ open, user, onClose, onConfirm }: Props) {
  const [tier, setTier] = useState<Tier>(user.tier)
  const [days, setDays] = useState<string>('365')
  const [note, setNote] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  // Determine if expiry days field is relevant
  const showExpiry = ['premium', 'basic'].includes(tier)
  const isNeverExpires = ['admin', 'vip'].includes(tier)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!tier) {
      setError('Tier wajib dipilih')
      return
    }

    let daysNum: number | null = null
    if (showExpiry) {
      const parsed = parseInt(days, 10)
      if (isNaN(parsed) || parsed <= 0) {
        setError('Jumlah hari harus angka positif')
        return
      }
      daysNum = parsed
    }

    setSaving(true)
    try {
      await onConfirm(tier, daysNum, note.trim() || null)
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Gagal mengubah tier')
    } finally {
      setSaving(false)
    }
  }

  const currentInfo = TIER_INFO[user.tier]

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900">
          <div>
            <h3 className="text-base font-bold text-slate-100">Change Tier</h3>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 font-bold flex items-center justify-center hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Current tier info */}
        <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-700/50">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tier Saat Ini</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${currentInfo.color} ${currentInfo.textColor} ${currentInfo.borderColor}`}>
              {currentInfo.label}
            </span>
            {user.tier_expires_at && (
              <span className="text-[10px] text-slate-400">
                Expires: {new Date(user.tier_expires_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Tier dropdown */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
              Tier Baru
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {TIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.description}
                </option>
              ))}
            </select>
          </div>

          {/* Expiry days (only for premium/basic) */}
          {showExpiry && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                Durasi (hari)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  min={1}
                  max={3650}
                  placeholder="365"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setDays('30')}
                  className="px-3 py-2 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition"
                >
                  30d
                </button>
                <button
                  type="button"
                  onClick={() => setDays('90')}
                  className="px-3 py-2 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition"
                >
                  90d
                </button>
                <button
                  type="button"
                  onClick={() => setDays('365')}
                  className="px-3 py-2 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition"
                >
                  1yr
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Tier ini akan expire pada: <b className="text-slate-300">
                  {new Date(Date.now() + (parseInt(days) || 0) * 86400000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </b>
              </p>
            </div>
          )}

          {/* No expiry note */}
          {isNeverExpires && (
            <p className="text-[10px] text-amber-400/80 italic bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              ℹ️ Tier {TIER_INFO[tier].label} tidak memiliki expiry date.
            </p>
          )}

          {/* Admin note */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
              Catatan Admin (opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mis. Manual upgrade via WhatsApp pembayaran"
              maxLength={200}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              ⚠️ {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
            >
              {saving ? '⏳ Menyimpan...' : '💾 Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
