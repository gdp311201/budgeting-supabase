'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createTransaction } from '@/lib/api/transactions'
import {
  getSetupMaster,
  filterSubcategoriesByCategory,
  groupAccountsByType,
  determineTransactionType,
  type SetupMaster,
} from '@/lib/api/setup-master'
import type { Database } from '@/lib/types/database'
import { formatRupiah, parseRupiah, cn } from '@/lib/utils/format'

type Category = Database['public']['Tables']['categories']['Row']
type Account = Database['public']['Tables']['accounts']['Row']

interface Props {
  user: User
  targetUserId?: string
}

const TODAY = () => new Date().toISOString().slice(0, 10)

export default function InputView({ user, targetUserId }: Props) {
  const [master, setMaster] = useState<SetupMaster | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [date, setDate] = useState(TODAY())
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [nominal, setNominal] = useState('')
  const [accountId, setAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [note, setNote] = useState('')

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load setup master on mount + when targetUserId changes
  useEffect(() => {
    getSetupMaster(targetUserId)
      .then(setMaster)
      .catch((err) => {
        console.error('Failed to load setup:', err)
        setMsg({ type: 'error', text: 'Gagal memuat data setup: ' + err.message })
      })
      .finally(() => setLoading(false))
  }, [targetUserId])

  // Get selected category object
  const selectedCategory = master?.categories.find((c) => c.id === categoryId)
  const isPindahDana = selectedCategory?.type === 'transfer'

  // Filtered subcategories based on selected category
  const filteredSubcategories = master
    ? filterSubcategoriesByCategory(master.subcategories, categoryId)
    : []

  // Grouped accounts for dropdown
  const groupedAccounts = master ? groupAccountsByType(master.accounts) : null

  // Reset subkategori when kategori changes
  useEffect(() => {
    setSubcategoryId('')
  }, [categoryId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    const cleanNominal = parseRupiah(nominal)
    if (!cleanNominal || cleanNominal <= 0) {
      setMsg({ type: 'error', text: 'Nominal tidak valid' })
      return
    }

    if (!categoryId || !accountId) {
      setMsg({ type: 'error', text: 'Kategori dan akun wajib diisi' })
      return
    }

    // For PINDAH DANA, require to_account_id
    if (isPindahDana && !toAccountId) {
      setMsg({ type: 'error', text: 'Pindah dana wajib pilih akun tujuan' })
      return
    }

    if (isPindahDana && toAccountId === accountId) {
      setMsg({ type: 'error', text: 'Akun asal dan tujuan tidak boleh sama' })
      return
    }

    setSubmitting(true)

    try {
      const txType = determineTransactionType(selectedCategory?.type)

      // Insert main transaction (pass targetUserId for shared access)
      await createTransaction({
        user_id: user.id,
        transaction_date: date,
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        account_id: accountId,
        to_account_id: isPindahDana ? toAccountId : null,
        amount: cleanNominal,
        type: txType,
        note: note.trim() || subcategoryId ? undefined : null,
      }, targetUserId)

      setMsg({
        type: 'success',
        text: `Transaksi ${formatRupiah(cleanNominal)} berhasil dicatat!`,
      })

      // Reset form (keep date)
      setNominal('')
      setNote('')
      setCategoryId('')
      setSubcategoryId('')
      setAccountId('')
      setToAccountId('')
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message ?? 'Gagal menyimpan' })
    } finally {
      setSubmitting(false)
    }
  }

  function handleNominalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const clean = e.target.value.replace(/[^0-9]/g, '')
    setNominal(clean)
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="pb-2 border-b border-pink-200/50">
          <h1 className="text-base font-bold text-pink-950/80 tracking-wide">INPUT TRANSAKSI</h1>
          <p className="text-[11px] text-pink-800/60 font-medium">Catat pengeluaran & pemasukan</p>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mb-2"></div>
          <p className="text-xs text-pink-800/60 font-medium">Memuat data setup...</p>
        </div>
      </div>
    )
  }

  // ============================================================
  // ERROR STATE: No setup data
  // ============================================================
  if (!master || master.categories.length === 0) {
    return (
      <div className="space-y-4">
        <div className="pb-2 border-b border-pink-200/50">
          <h1 className="text-base font-bold text-pink-950/80 tracking-wide">INPUT TRANSAKSI</h1>
          <p className="text-[11px] text-pink-800/60 font-medium">Catat pengeluaran & pemasukan</p>
        </div>
        <div className="text-center py-12 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-xs font-bold text-amber-900">Belum ada data setup</p>
          <p className="text-[10px] text-amber-800/70 mt-1">
            Buka tab <b>Setting</b> dulu untuk setup akun bank & kategori,
            lalu balik ke sini buat input transaksi.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-pink-200/50">
        <h1 className="text-base font-bold text-pink-950/80 tracking-wide">INPUT TRANSAKSI</h1>
        <p className="text-[11px] text-pink-800/60 font-medium">Catat pengeluaran & pemasukan</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Tanggal */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-pink-900/70 mb-1">
            Tanggal
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-white/60 border border-pink-200 rounded-xl px-3.5 py-2 font-medium text-sm"
            style={{ width: '100%', WebkitAppearance: 'none' }}
          />
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-pink-900/70 mb-1">
            Kategori
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className={cn(
              'w-full bg-white/60 border rounded-xl px-3.5 py-2 text-sm',
              categoryId ? 'border-pink-200' : 'border-pink-200 text-pink-400'
            )}
          >
            <option value="" disabled>-- Pilih Kategori --</option>
            {master.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          {selectedCategory && (
            <p className="text-[10px] text-pink-700/60 mt-1 px-1">
              Tipe: <b>{selectedCategory.type}</b>
              {isPindahDana && ' · Mode: Pindah Dana (perlu akun asal & tujuan)'}
            </p>
          )}
        </div>

        {/* Sub Kategori (skip for PINDAH DANA) */}
        {categoryId && !isPindahDana && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-pink-900/70 mb-1">
              Sub Kategori
            </label>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className={cn(
                'w-full bg-white/60 border rounded-xl px-3.5 py-2 text-sm',
                subcategoryId ? 'border-pink-200' : 'border-pink-200 text-pink-400'
              )}
            >
              <option value="">-- Pilih Sub Kategori --</option>
              {filteredSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
            {filteredSubcategories.length === 0 && (
              <p className="text-[10px] text-amber-700 mt-1 px-1">
                ⚠️ Kategori ini belum punya subkategori. Buka tab Setting buat tambah.
              </p>
            )}
          </div>
        )}

        {/* Nominal */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-pink-900/70 mb-1">
            Nominal
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-pink-700/60">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={nominal ? Number(nominal).toLocaleString('id-ID') : ''}
              onChange={handleNominalChange}
              placeholder="0"
              required
              className="w-full bg-white/60 border border-pink-200 rounded-xl pl-10 pr-3.5 py-2 font-bold text-sm text-right"
            />
          </div>
        </div>

        {/* Akun Asal (untuk semua transaksi) */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-pink-900/70 mb-1">
            {isPindahDana ? '🏦 Dari Akun (Asal)' : '🏦 Akun'}
          </label>
          <AccountSelect
            value={accountId}
            onChange={setAccountId}
            placeholder={isPindahDana ? '-- Pilih Akun Asal --' : '-- Pilih Akun --'}
            groupedAccounts={groupedAccounts}
            excludeInvestment={!isPindahDana && selectedCategory?.type !== 'investment'}
            excludeId={toAccountId}
          />
        </div>

        {/* Akun Tujuan (only for PINDAH DANA) */}
        {isPindahDana && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-pink-900/70 mb-1">
              🎯 Ke Akun (Tujuan)
            </label>
            <AccountSelect
              value={toAccountId}
              onChange={setToAccountId}
              placeholder="-- Pilih Akun Tujuan --"
              groupedAccounts={groupedAccounts}
              excludeId={accountId}
            />
          </div>
        )}

        {/* Catatan (optional) */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-pink-900/70 mb-1">
            Catatan (opsional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Mis. Belanja bulanan, Gaji November, dll"
            className="w-full bg-white/60 border border-pink-200 rounded-xl px-3.5 py-2 text-sm"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 text-white font-semibold py-2.5 px-3 rounded-xl shadow-sm hover:shadow-md transition text-sm border border-pink-200/50"
        >
          {submitting ? '⏳ Memproses...' : '💾 Simpan Transaksi'}
        </button>
      </form>

      {/* Success / Error message */}
      {msg && (
        <div
          className={cn(
            'text-center text-xs font-bold rounded-xl py-2.5 px-3',
            msg.type === 'success'
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
              : 'text-rose-700 bg-rose-50 border border-rose-200'
          )}
        >
          {msg.type === 'success' ? '✨ ' : '⚠️ '}
          {msg.text}
        </div>
      )}
    </div>
  )
}

// ============================================================
// SUB-COMPONENT: AccountSelect (grouped dropdown)
// ============================================================
function AccountSelect({
  value,
  onChange,
  placeholder,
  groupedAccounts,
  excludeInvestment = false,
  excludeId,
}: {
  value: string
  onChange: (val: string) => void
  placeholder: string
  groupedAccounts: ReturnType<typeof groupAccountsByType> | null
  excludeInvestment?: boolean
  excludeId?: string
}) {
  if (!groupedAccounts) {
    return (
      <select disabled className="w-full bg-white/60 border border-pink-200 rounded-xl px-3.5 py-2 text-sm text-pink-400">
        <option>Memuat...</option>
      </select>
    )
  }

  const { cash, bank, ewallet, investment } = groupedAccounts
  const totalOptions =
    cash.length + bank.length + ewallet.length + (excludeInvestment ? 0 : investment.length)

  if (totalOptions === 0) {
    return (
      <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 text-xs text-amber-700">
        ⚠️ Belum ada akun aktif. Buka tab <b>Setting</b> buat pilih akun yang dipakai.
      </div>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className={cn(
        'w-full bg-white/60 border rounded-xl px-3.5 py-2 text-sm',
        value ? 'border-pink-200' : 'border-pink-200 text-pink-400'
      )}
    >
      <option value="" disabled>{placeholder}</option>
      {cash.length > 0 && (
        <optgroup label="💵 CASH">
          {cash
            .filter((a) => a.id !== excludeId)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
        </optgroup>
      )}
      {bank.length > 0 && (
        <optgroup label="🏦 BANK">
          {bank
            .filter((a) => a.id !== excludeId)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
        </optgroup>
      )}
      {ewallet.length > 0 && (
        <optgroup label="📱 E-WALLET">
          {ewallet
            .filter((a) => a.id !== excludeId)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
        </optgroup>
      )}
      {!excludeInvestment && investment.length > 0 && (
        <optgroup label="💰 INVESTASI">
          {investment
            .filter((a) => a.id !== excludeId)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
        </optgroup>
      )}
    </select>
  )
}
