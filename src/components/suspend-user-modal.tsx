'use client'

import { useState } from 'react'

interface AdminUser {
  user_id: string
  email: string
  full_name: string | null
  tier: string
}

interface Props {
  open: boolean
  user: AdminUser
  onClose: () => void
  onConfirm: (reason: string, customNote: string) => Promise<void>
}

const SUSPEND_REASONS: { value: string; label: string; description: string }[] = [
  {
    value: 'Spam / Abuse',
    label: '🚫 Spam / Abuse',
    description: 'User melakukan spam, harassment, atau penyalahgunaan platform',
  },
  {
    value: 'Non-payment / Refund',
    label: '💳 Non-payment / Refund',
    description: 'User minta refund atau gagal pembayaran berulang',
  },
  {
    value: 'Violation of Terms',
    label: '⚖️ Pelanggaran Ketentuan',
    description: 'User melanggar ToS atau kebijakan platform',
  },
  {
    value: 'Account Compromised',
    label: '🔐 Akun Diretas',
    description: 'Akun user diindikasikan diretas atau aktivitas mencurigakan',
  },
  {
    value: 'Manual Review',
    label: '🔍 Review Manual',
    description: 'Sedang dalam investigasi / pending review',
  },
  {
    value: 'Other',
    label: '📝 Alasan Lain',
    description: 'Alasan custom — tulis di field di bawah',
  },
]

/**
 * SuspendUserModal — dropdown UI for suspending user
 *
 * Replaces the buggy prompt()-based approach.
 * Returns reason (selected or custom) + optional custom note.
 */
export default function SuspendUserModal({ open, user, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState<string>('Spam / Abuse')
  const [customNote, setCustomNote] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const isOtherReason = reason === 'Other'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!reason) {
      setError('Alasan suspend wajib dipilih')
      return
    }

    if (isOtherReason && !customNote.trim()) {
      setError('Untuk "Alasan Lain", wajib isi catatan custom')
      return
    }

    setSaving(true)
    try {
      await onConfirm(reason, customNote.trim())
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Gagal suspend user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-rose-900/40 to-slate-900">
          <div>
            <h3 className="text-base font-bold text-rose-300">🚫 Suspend User</h3>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 font-bold flex items-center justify-center hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Warning */}
        <div className="px-5 py-3 bg-rose-500/10 border-b border-rose-500/20">
          <p className="text-xs text-rose-200 leading-relaxed">
            ⚠️ User yang di-suspend <b>tidak dapat login</b> ke aplikasi. Data mereka tetap tersimpan
            dan dapat di-restore kapan saja dengan unsuspend.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Reason dropdown */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
              Alasan Suspend
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {SUSPEND_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Description for selected reason */}
            <p className="text-[10px] text-slate-500 mt-1.5 italic">
              {SUSPEND_REASONS.find((r) => r.value === reason)?.description}
            </p>
          </div>

          {/* Custom note (always shown, but required for "Other") */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
              Catatan {isOtherReason && <span className="text-rose-400">(wajib)</span>}
            </label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={
                isOtherReason
                  ? 'Jelaskan alasan custom di sini (wajib)...'
                  : 'Detail tambahan (opsional)...'
              }
              rows={2}
              maxLength={300}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              ⚠️ {error}
            </div>
          )}

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              required
              className="w-4 h-4 mt-0.5 accent-rose-500"
            />
            <span>Saya memahami bahwa user ini akan kehilangan akses ke aplikasi sampai di-unsuspend.</span>
          </label>

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
              className="flex-1 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
            >
              {saving ? '⏳ Suspending...' : '🚫 Suspend User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
