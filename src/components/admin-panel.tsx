'use client'

import { useEffect, useState } from 'react'
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

type AllowedEmail = Database['public']['Tables']['allowed_emails']['Row']

interface Props {
  onClose: () => void
}

export default function AdminPanel({ onClose }: Props) {
  const [whitelist, setWhitelist] = useState<AllowedEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newPremium, setNewPremium] = useState(false)
  const [newTheme, setNewTheme] = useState('')
  const [newMascot, setNewMascot] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listWhitelist()
      setWhitelist(data)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load whitelist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await addToWhitelist({
        email: newEmail,
        full_name: newName,
        is_premium: newPremium,
        assigned_theme: newTheme || undefined,
        assigned_mascot: newMascot || undefined,
        notes: newNotes,
      })
      // Reset form
      setNewEmail('')
      setNewName('')
      setNewPremium(false)
      setNewTheme('')
      setNewMascot('')
      setNewNotes('')
      // Reload
      await load()
    } catch (err: any) {
      setError(err.message ?? 'Failed to add email')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(email: string) {
    if (!confirm(`Deactivate ${email}? User tidak akan bisa login lagi.`)) return
    try {
      await removeFromWhitelist(email)
      await load()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleReactivate(email: string) {
    try {
      await reactivateInWhitelist(email)
      await load()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDelete(email: string) {
    if (!confirm(`HAPUS PERMANEN ${email}? Tidak bisa di-undo.`)) return
    try {
      await deleteFromWhitelist(email)
      await load()
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-pink-950/40 backdrop-blur-[5px]">
      <div className="bg-white/95 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide drop-shadow">
              ⚙️ Admin Panel
            </h3>
            <p className="text-[11px] text-white/90 font-semibold mt-0.5">
              Manage email whitelist (anti share-link abuse)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-4 py-4 flex-1 space-y-5">
          {loading && (
            <p className="text-center text-xs text-pink-800/60 py-8">Memuat whitelist...</p>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
              ❌ {error}
              <button
                onClick={load}
                className="mt-1 block text-rose-900 font-bold underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* Add new whitelist form */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-pink-950 uppercase tracking-wider">
              ➕ Tambah Email ke Whitelist
            </h4>
            <form onSubmit={handleAdd} className="space-y-2">
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
          </section>

          {/* Existing whitelist */}
          <section>
            <h4 className="text-xs font-bold text-pink-950 uppercase tracking-wider mb-2">
              📋 Email Terdaftar ({whitelist.length})
            </h4>
            <div className="space-y-2">
              {whitelist.length === 0 && !loading && (
                <p className="text-xs text-pink-700/60 italic text-center py-4">
                  Belum ada email di whitelist
                </p>
              )}
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
                        <p className="text-[10px] text-pink-700/60 italic mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {entry.is_active ? (
                      <button
                        onClick={() => handleDeactivate(entry.email)}
                        className="text-[9px] bg-rose-100 text-rose-700 px-2 py-1 rounded hover:bg-rose-200"
                      >
                        🚫 Nonaktifkan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(entry.email)}
                        className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200"
                      >
                        ✅ Aktifkan
                      </button>
                    )}
                    <button
                      onClick={() => handleGrantElephant(entry.email)}
                      className="text-[9px] bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                      title="Beri akses maskot gajah (private)"
                    >
                      🐘 Grant Gajah
                    </button>
                    <button
                      onClick={() => handleDelete(entry.email)}
                      className="text-[9px] bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Help text */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800">
            <b>📌 Cara pakai:</b>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Tambah email customer ke whitelist</li>
              <li>Kirim link app ke customer</li>
              <li>Customer signup Google → auto-allowed</li>
              <li>Email lain coba signup → ditolak otomatis</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-pink-200/60 bg-white/60">
          <button
            onClick={onClose}
            className="w-full bg-white/90 text-pink-950 font-semibold py-2.5 px-4 rounded-xl border border-pink-200/80 shadow-sm text-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
