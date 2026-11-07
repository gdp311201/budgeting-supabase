'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/format'

interface PairingStatus {
  status: 'success' | 'error'
  pairing_status: 'none' | 'pending_sent' | 'active'
  partner_email?: string
  partner_name?: string
  partner_id?: string
  request_id?: string
  days_remaining?: number
  message?: string
}

interface PendingRequest {
  request_id: string
  from_user_id: string
  from_email: string
  from_name: string | null
  from_tier: string
  requested_at: string
  days_remaining: number
}

interface Props {
  open: boolean
  onClose: () => void
  onPairingChanged: () => void
}

const WA_LINK = 'https://wa.me/6281575859792?text=Halo%20Julyo%2C%20saya%20mau%20tanya%20tentang%20Couple%20Budgeting'

/**
 * CoupleBudgetingModal — Self-service pairing system
 *
 * States:
 * 1. 'none' → User can enter partner email to send request
 * 2. 'pending_sent' → Waiting for partner response (show cancel button)
 * 3. 'active' → Paired (show unpair button)
 *
 * Also shows pending requests received from other users (accept/reject).
 */
export default function CoupleBudgetingModal({ open, onClose, onPairingChanged }: Props) {
  const [mounted, setMounted] = useState(false)
  const [pairingStatus, setPairingStatus] = useState<PairingStatus | null>(null)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [partnerEmail, setPartnerEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const supabase = createClient()

      // Get pairing status
      const { data: statusData, error: statusErr } = await supabase.rpc('get_pairing_status')
      if (statusErr) throw new Error(statusErr.message)
      setPairingStatus(statusData as PairingStatus)

      // Get pending requests
      const { data: pendingData, error: pendingErr } = await supabase.rpc('get_pending_pairing_requests')
      if (pendingErr) throw new Error(pendingErr.message)
      const pendingResult = pendingData as any
      setPendingRequests(pendingResult?.requests ?? [])
    } catch (err: any) {
      setError(err.message ?? 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) loadData()
  }, [open, loadData])

  if (!open || !mounted || typeof document === 'undefined') return null

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!partnerEmail.trim()) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.rpc('create_pairing_request', {
        p_partner_email: partnerEmail.trim().toLowerCase(),
      })
      if (err) throw new Error(err.message)
      const result = data as any
      if (result.status === 'error') throw new Error(result.message)
      setSuccess(result.message)
      setPartnerEmail('')
      await loadData()
      onPairingChanged()
    } catch (err: any) {
      setError(err.message ?? 'Gagal mengirim permintaan')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAccept(requestId: string) {
    setActionLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.rpc('accept_pairing_request', {
        p_request_id: requestId,
      })
      if (err) throw new Error(err.message)
      const result = data as any
      if (result.status === 'error') throw new Error(result.message)
      setSuccess(result.message)
      await loadData()
      onPairingChanged()
    } catch (err: any) {
      setError(err.message ?? 'Gagal accept')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject(requestId: string) {
    setActionLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.rpc('reject_pairing_request', {
        p_request_id: requestId,
      })
      if (err) throw new Error(err.message)
      await loadData()
    } catch (err: any) {
      setError(err.message ?? 'Gagal reject')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelRequest(requestId: string) {
    if (!confirm('Batalkan permintaan pairing ini?')) return
    setActionLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.rpc('cancel_pairing_request', {
        p_request_id: requestId,
      })
      if (err) throw new Error(err.message)
      await loadData()
      onPairingChanged()
    } catch (err: any) {
      setError(err.message ?? 'Gagal membatalkan')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUnpair() {
    if (!confirm('Putus pairing? Data masing-masing tetap aman dan tidak tercampur.')) return
    setActionLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.rpc('unpair')
      if (err) throw new Error(err.message)
      const result = data as any
      if (result.status === 'error') throw new Error(result.message)
      setSuccess(result.message)
      await loadData()
      onPairingChanged()
    } catch (err: any) {
      setError(err.message ?? 'Gagal putus pairing')
    } finally {
      setActionLoading(false)
    }
  }

  const ps = pairingStatus?.pairing_status ?? 'none'

  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-pink-950/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="premium-modal-border w-full max-w-sm animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="premium-modal-inner bg-white/90 backdrop-blur-xl rounded-[calc(1.5rem-2px)] p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="w-14 h-14 mx-auto mb-2 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-pink-100 border border-pink-200">
              💑
            </div>
            <h3 className="text-sm font-bold text-pink-950">Couple Budgeting</h3>
            <p className="text-[11px] text-pink-700/70">Share data budgeting dengan pasangan</p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mb-2" />
              <p className="text-xs text-pink-700/60">Memuat...</p>
            </div>
          ) : (
            <>
              {/* Error / Success messages */}
              {error && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
                  ✅ {success}
                </div>
              )}

              {/* Pending requests received */}
              {pendingRequests.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-pink-700">
                    📨 Permintaan Masuk ({pendingRequests.length})
                  </p>
                  {pendingRequests.map((req) => (
                    <div
                      key={req.request_id}
                      className="bg-pink-50 border border-pink-200 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">📊</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-pink-950 truncate">
                            {req.from_name || req.from_email}
                          </p>
                          <p className="text-[10px] text-pink-700/60 truncate">
                            {req.from_email} · {req.days_remaining} hari lagi
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(req.request_id)}
                          disabled={actionLoading}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[10px] font-bold py-1.5 rounded-lg transition"
                        >
                          ✅ Accept
                        </button>
                        <button
                          onClick={() => handleReject(req.request_id)}
                          disabled={actionLoading}
                          className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-[10px] font-bold py-1.5 rounded-lg transition"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Status: Active pairing */}
              {ps === 'active' && pairingStatus && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">
                    Status: Aktif
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-xl">📊</span>
                    <div>
                      <p className="text-sm font-bold text-emerald-950">
                        {pairingStatus.partner_name || pairingStatus.partner_email}
                      </p>
                      <p className="text-[10px] text-emerald-700/60">
                        {pairingStatus.partner_email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleUnpair}
                    disabled={actionLoading}
                    className="mt-3 w-full bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold py-2 rounded-lg border border-rose-300 transition disabled:opacity-50"
                  >
                    ❌ Putus Pairing
                  </button>
                </div>
              )}

              {/* Status: Pending sent */}
              {ps === 'pending_sent' && pairingStatus && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700">
                    Status: Menunggu Respons
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-xl">⏳</span>
                    <div>
                      <p className="text-sm font-bold text-amber-950">
                        {pairingStatus.partner_name || pairingStatus.partner_email}
                      </p>
                      <p className="text-[10px] text-amber-700/60">
                        {pairingStatus.partner_email} · {pairingStatus.days_remaining} hari lagi
                      </p>
                    </div>
                  </div>
                  {pairingStatus.request_id && (
                    <button
                      onClick={() => handleCancelRequest(pairingStatus.request_id!)}
                      disabled={actionLoading}
                      className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold py-2 rounded-lg border border-gray-300 transition disabled:opacity-50"
                    >
                      🗑️ Batalkan Permintaan
                    </button>
                  )}
                </div>
              )}

              {/* Status: None — form to send request */}
              {ps === 'none' && pendingRequests.length === 0 && (
                <form onSubmit={handleSendRequest} className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-pink-700 block mb-1.5">
                      Email Pasangan
                    </label>
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="pasangan@email.com"
                      required
                      className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm text-pink-950 placeholder-pink-300 focus:border-pink-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
                  >
                    {actionLoading ? '⏳ Mengirim...' : '💬 Kirim Permintaan Pairing'}
                  </button>
                </form>
              )}

              {/* Info box */}
              <div className="mt-4 bg-pink-50/50 border border-pink-100 rounded-xl p-3">
                <p className="text-[10px] text-pink-700/70 leading-relaxed">
                  ℹ️ <b>Cara kerja:</b><br />
                  1. Masukkan email pasangan<br />
                  2. Pasangan accept di app-nya<br />
                  3. Kalian bisa saling lihat & input data<br />
                  <br />
                  ⚠️ Kedua user harus Premium tier.<br />
                  ⏰ Permintaan expired dalam 7 hari.
                </p>
              </div>

              {/* Help link */}
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-3 text-center text-[10px] text-pink-700/60 hover:text-pink-900 underline"
              >
                Butuh bantuan? Hubungi via WhatsApp
              </a>
            </>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full mt-4 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
