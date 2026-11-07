'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'

interface Props {
  open: boolean
  onClose: () => void
  waLink: string
}

const CATEGORIES = [
  { value: 'bug', label: '🐛 Bug Report' },
  { value: 'feature', label: '💡 Feature Request' },
  { value: 'general', label: '💬 General Feedback' },
  { value: 'pricing', label: '💰 Pricing Question' },
]

export default function FeedbackModal({ open, onClose, waLink }: Props) {
  const [mounted, setMounted] = useState(false)
  const [rating, setRating] = useState(5)
  const [category, setCategory] = useState('general')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!open || !mounted || typeof document === 'undefined') return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id ?? null,
          email: user?.email ?? null,
          rating,
          category,
          message: message.trim(),
          status: 'new',
        })

      if (insertError) throw new Error(insertError.message)
      setSuccess(true)
      setMessage('')
    } catch (err: any) {
      setError(err.message ?? 'Gagal mengirim feedback')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setSuccess(false)
    setError(null)
    setRating(5)
    setCategory('general')
    setMessage('')
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-pink-950/60 backdrop-blur-md"
      onClick={handleClose}
    >
      <div
        className="premium-modal-border w-full max-w-sm animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="premium-modal-inner bg-white/80 backdrop-blur-xl rounded-[calc(1.5rem-2px)] p-5 shadow-2xl">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-emerald-100 border border-emerald-200">
                ✅
              </div>
              <h3 className="text-sm font-bold text-pink-950 mb-1">Feedback Terkirim!</h3>
              <p className="text-[11px] text-pink-700/70 mb-4">
                Terima kasih atas feedback Anda. Kami akan meninjau dan merespons secepatnya.
              </p>
              <button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
              >
                Tutup
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-4">
                <div className="w-14 h-14 mx-auto mb-2 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-pink-100 border border-pink-200">
                  💬
                </div>
                <h3 className="text-sm font-bold text-pink-950">Kirim Feedback</h3>
                <p className="text-[11px] text-pink-700/70">Saran & masukan Anda sangat berarti</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Rating */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-pink-700 block mb-1.5">
                    Rating
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition ${star <= rating ? 'opacity-100' : 'opacity-30'}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-pink-700 block mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm text-pink-950 focus:border-pink-400 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-pink-700 block mb-1.5">
                    Pesan
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tulis saran, kritik, atau pertanyaan Anda..."
                    rows={3}
                    required
                    maxLength={500}
                    className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm text-pink-950 placeholder-pink-300 focus:border-pink-400 focus:outline-none resize-none"
                  />
                  <p className="text-[9px] text-pink-700/50 mt-0.5 text-right">{message.length}/500</p>
                </div>

                {error && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
                >
                  {submitting ? '⏳ Mengirim...' : '📤 Kirim Feedback'}
                </button>
              </form>

              {/* WhatsApp option */}
              <div className="mt-3 pt-3 border-t border-pink-100">
                <p className="text-[10px] text-pink-700/60 text-center mb-2">Atau chat langsung via WhatsApp:</p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition text-center"
                >
                  💬 WhatsApp Developer
                </a>
              </div>

              <button
                onClick={handleClose}
                className="w-full mt-3 text-pink-700/60 hover:text-pink-900 text-xs font-medium py-1"
              >
                Batal
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
