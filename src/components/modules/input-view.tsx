'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createTransaction } from '@/lib/api/transactions'
import { formatRupiahInput, parseRupiah } from '@/lib/utils/format'

export default function InputView({ user }: { user: User }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [kategori, setKategori] = useState('')
  const [subKategori, setSubKategori] = useState('')
  const [nominal, setNominal] = useState('')
  const [akun, setAkun] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const KATEGORI = [
    '💸 PINDAH DANA',
    '💵 PEMASUKAN',
    '💰 TABUNGAN/ INVESTASI',
    '🍚 KEBUTUHAN POKOK',
    '🏠 TEMPAT TINGGAL',
    '🚌 TRANSPORTASI',
    '🩺 KESEHATAN',
    '💇 PERAWATAN DIRI',
    '📚 PENGEMBANGAN DIRI',
    '🎉 GAYA HIDUP/ HIBURAN',
    '💳 HUTANG / CICILAN',
    '⚠️ LAIN-LAIN',
  ]
  const AKUN = ['SEABANK', 'BCA', 'MANDIRI', 'DANA', 'CASH']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanNominal = parseRupiah(nominal)
    if (!cleanNominal || cleanNominal <= 0) {
      setMsg({ type: 'error', text: 'Nominal tidak valid' })
      return
    }

    setLoading(true)
    setMsg(null)
    try {
      // Determine transaction type from kategori
      const type = kategori.includes('PEMASUKAN')
        ? 'income'
        : kategori.includes('PINDAH DANA')
        ? 'transfer_out'
        : kategori.includes('TABUNGAN') || kategori.includes('INVESTASI')
        ? 'investment'
        : 'expense'

      await createTransaction({
        user_id: user.id,
        transaction_date: date,
        category_id: '', // TODO: resolve category by name
        subcategory_id: null,
        account_id: '', // TODO: resolve account by name
        amount: cleanNominal,
        type,
        note: subKategori,
      })

      setMsg({ type: 'success', text: 'Transaksi berhasil disimpan!' })
      setNominal('')
      setKategori('')
      setSubKategori('')
      setAkun('')
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message ?? 'Gagal menyimpan' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-pink-200/50">
        <h1 className="text-base font-bold text-pink-950/80 tracking-wide">INPUT TRANSAKSI</h1>
        <p className="text-[11px] text-pink-800/60 font-medium">Catat pengeluaran & pemasukan</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-pink-900/70 mb-1">
            Tanggal
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-white/80 border border-pink-200 rounded-xl px-3.5 py-2 font-medium text-sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-pink-900/70 mb-1">
            Kategori
          </label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            required
            className="w-full bg-white/80 border border-pink-200 rounded-xl px-3.5 py-2 text-sm"
          >
            <option value="" disabled selected hidden>-- Pilih Kategori --</option>
            {KATEGORI.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-pink-900/70 mb-1">
            Sub Kategori
          </label>
          <input
            type="text"
            value={subKategori}
            onChange={(e) => setSubKategori(e.target.value)}
            placeholder="Mis. Makanan, BBM, Gaji"
            required
            className="w-full bg-white/80 border border-pink-200 rounded-xl px-3.5 py-2 font-medium text-sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-pink-900/70 mb-1">
            Nominal (Rp)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={nominal}
            onChange={(e) => {
              setNominal(e.target.value)
              formatRupiahInput(e.target)
            }}
            placeholder="Rp 0"
            required
            className="w-full bg-white/80 border border-pink-200 rounded-xl px-3.5 py-2 font-medium text-sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-pink-900/70 mb-1">
            Akun Bank
          </label>
          <select
            value={akun}
            onChange={(e) => setAkun(e.target.value)}
            required
            className="w-full bg-white/80 border border-pink-200 rounded-xl px-3.5 py-2 text-sm"
          >
            <option value="" disabled selected hidden>-- Pilih Akun --</option>
            {AKUN.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 text-white font-semibold py-2.5 px-3 rounded-xl shadow-sm hover:shadow-md transition text-sm border border-pink-200/50"
        >
          {loading ? '⏳ Memproses...' : 'Simpan Transaksi'}
        </button>
      </form>

      {msg && (
        <div
          className={`text-center text-xs font-bold rounded-xl py-2 px-3 ${
            msg.type === 'success'
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
              : 'text-rose-700 bg-rose-50 border border-rose-200'
          }`}
        >
          {msg.type === 'success' ? '✨ ' : '⚠️ '}
          {msg.text}
        </div>
      )}

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800">
        <b>⚠️ Catatan:</b> Ini starter template. Form ini butuh adaptasi:
        <ul className="list-disc list-inside mt-1 space-y-0.5">
          <li>Resolve category_id & account_id dari nama (lihat <code>src/lib/api/setup.ts</code>)</li>
          <li>Load kategori/subkategori dinamis dari Supabase</li>
          <li>Handle PINDAH DANA dengan to_account_id</li>
        </ul>
      </div>
    </div>
  )
}
