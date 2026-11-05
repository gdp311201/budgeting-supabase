'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  onComplete: (nickname: string) => void
}

export default function OnboardingModal({ userId, onComplete }: Props) {
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nickname.trim()
    if (!trimmed) {
      setError('Nama panggilan wajib diisi')
      return
    }
    if (trimmed.length > 30) {
      setError('Nama panggilan maksimal 30 karakter')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: trimmed })
        .eq('id', userId)

      if (updateError) throw new Error(updateError.message)

      onComplete(trimmed)
    } catch (err: any) {
      setError(err.message ?? 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-pink-950/60 backdrop-blur-md">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-xs w-full p-6 text-center animate-pop">
        {/* Icon */}
        <div className="text-5xl mb-3 animate-pulse">🐘</div>

        {/* Title */}
        <h2 className="text-lg font-bold text-pink-950 mb-1">Selamat Datang!</h2>
        <p className="text-xs text-pink-800/70 mb-4 leading-relaxed">
          Sebelum mulai, kenalan dulu yuk! <br />
          Isi nama panggilan kamu supaya kami bisa menyapamu dengan lebih personal 🌸
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Nama panggilan kamu..."
            maxLength={30}
            required
            autoFocus
            className="w-full bg-white/80 border-2 border-pink-200 rounded-xl px-4 py-2.5 text-sm font-medium text-center focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />

          {error && (
            <p className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg py-1.5 px-2">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition text-sm"
          >
            {saving ? '⏳ Menyimpan...' : 'Mulai Budgeting →'}
          </button>
        </form>

        <p className="text-[9px] text-pink-700/50 mt-3">
          Kamu bisa mengubah nama ini kapan saja di pengaturan
        </p>
      </div>
    </div>
  )
}
