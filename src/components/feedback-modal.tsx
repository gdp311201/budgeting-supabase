'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/format'

interface Props {
  open: boolean
  onClose: () => void
  waLink: string
}

const FEEDBACK_TYPES = [
  { value: 'feedback', label: '💬 Feedback Umum', desc: 'Kritik, saran, atau apresiasi' },
  { value: 'suggestion', label: '💡 Saran Fitur', desc: 'Ide fitur baru yang kamu mau' },
  { value: 'bug', label: '🐛 Lapor Bug', desc: 'Ada yang nggak berfungsi dengan benar' },
  { value: 'feature_request', label: '✨ Request Fitur', desc: 'Fitur yang kamu butuhkan' },
]

export default function FeedbackModal({ open, onClose, waLink }: Props) {
  const [type, setType] = useState('feedback')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!open) return null

  async function handleSubmit() {
    if (!message.trim()) {
      alert('Pesan tidak boleh kosong')
      return
    }
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: userData.user.id,
          type,
          message: message.trim(),
        })

      if (error) throw new Error(error.message)
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setMessage('')
        onClose()
      }, 2000)
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-pink-950/50 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-pop">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 shrink-0"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}
        >
          <div>
            <h3 className="text-base font-bold text-white tracking-wide drop-shadow">💬 Kirim Feedback</h3>
            <p className="text-[11px] text-white/90 font-semibold mt-0.5">Saran & kritik kamu sangat berharga</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-4 py-4 flex-1">
          {submitted ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✨</div>
              <p className="text-sm font-bold text-pink-950">Terima kasih!</p>
              <p className="text-[11px] text-pink-700/60 mt-1">Feedback kamu sudah terkirim ke developer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-2">Tipe Feedback</label>
                <div className="grid grid-cols-2 gap-2">
                  {FEEDBACK_TYPES.map((ft) => (
                    <button
                      key={ft.value}
                      onClick={() => setType(ft.value)}
                      className={cn(
                        'p-3 rounded-xl border-2 transition text-left',
                        type === ft.value
                          ? 'border-pink-500 bg-pink-50 shadow-sm'
                          : 'border-gray-200 hover:border-pink-300'
                      )}
                    >
                      <p className="text-xs font-bold text-pink-950">{ft.label}</p>
                      <p className="text-[9px] text-pink-700/50 mt-0.5">{ft.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message textarea */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Pesan Kamu</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis kritik, saran, atau request fitur kamu di sini..."
                  rows={4}
                  maxLength={500}
                  className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-xs resize-none focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                />
                <p className="text-[9px] text-pink-700/50 mt-0.5 text-right">{message.length}/500</p>
              </div>

              {/* Submit buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition text-sm"
                >
                  {submitting ? '⏳ Mengirim...' : '📤 Kirim Feedback'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-pink-200/60"></div>
                  <span className="text-[9px] text-pink-700/40 font-bold uppercase">atau</span>
                  <div className="flex-1 h-px bg-pink-200/60"></div>
                </div>

                {/* WhatsApp direct */}
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition text-sm"
                >
                  💬 Chat Langsung via WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
