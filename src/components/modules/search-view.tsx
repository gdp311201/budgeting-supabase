'use client'

import { useEffect, useRef, useState } from 'react'
import {
  searchTransactions,
  type SearchData,
  type SearchTransaction,
} from '@/lib/api/search'
import {
  getSetupMaster,
  filterSubcategoriesByCategory,
  groupAccountsByType,
  determineTransactionType,
  type SetupMaster,
} from '@/lib/api/setup-master'
import { updateTransaction, deleteTransaction } from '@/lib/api/transactions'
import type { Database } from '@/lib/types/database'
import { formatRupiah, parseRupiah, getCurrentYear, getTahunListDynamic, cn } from '@/lib/utils/format'

type Account = Database['public']['Tables']['accounts']['Row']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

const BULAN_LIST = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
]

const SWIPE_OPEN_W = 84 // lebar tombol aksi (px)

interface Props {
  targetUserId?: string
  refreshKey?: number
}

export default function SearchView({ targetUserId, refreshKey }: Props = {}) {
  const [master, setMaster] = useState<SetupMaster | null>(null)
  const [loading, setLoading] = useState(true)

  const [keyword, setKeyword] = useState('')
  const [month, setMonth] = useState(0) // 0 = SEMUA
  const [year, setYear] = useState(getCurrentYear())
  const [sort, setSort] = useState<'DESC' | 'ASC'>('DESC')

  const [data, setData] = useState<SearchData | null>(null)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit modal state
  const [editingTx, setEditingTx] = useState<SearchTransaction | null>(null)

  // Delete confirmation state
  const [pendingDelete, setPendingDelete] = useState<SearchTransaction | null>(null)

  useEffect(() => {
    getSetupMaster(targetUserId)
      .then(setMaster)
      .catch((err) => {
        console.error('Failed to load setup:', err)
        setError('Gagal memuat data setup: ' + err.message)
      })
      .finally(() => setLoading(false))
  }, [targetUserId])

  async function loadSearch() {
    setFetching(true)
    setError(null)
    try {
      const result = await searchTransactions({
        month,
        year,
        keyword,
        sort,
        targetUserId,
      })
      if (result.status === 'success') {
        setData(result)
      } else {
        setError(result.message ?? 'Gagal memuat data pencarian')
      }
    } catch (err: any) {
      setError(err.message ?? 'Network error')
    } finally {
      setFetching(false)
    }
  }

  // Auto-reload when refreshKey changes (account switched) (Batch 4)
  useEffect(() => {
    if (refreshKey === undefined) return
    if (keyword) {  // Only reload if there's a search keyword
      loadSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  function handleSearchClick() {
    loadSearch()
  }

  function handleKeyEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      loadSearch()
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteTransaction(pendingDelete.id)
      setPendingDelete(null)
      // Reload search results
      await loadSearch()
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message)
    }
  }

  async function handleEditSave(updates: TransactionUpdate) {
    if (!editingTx) return
    try {
      await updateTransaction(editingTx.id, updates)
      setEditingTx(null)
      await loadSearch()
    } catch (err: any) {
      alert('Gagal update: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3.5">
        <div className="pb-2 border-b border-pink-200/50">
          <h1 className="text-base font-bold text-pink-950/80 tracking-wide">PENCARIAN BIAYA</h1>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mb-2"></div>
          <p className="text-xs text-pink-800/60 font-medium">Memuat data setup...</p>
        </div>
      </div>
    )
  }

  if (!master) {
    return (
      <div className="space-y-3.5">
        <div className="pb-2 border-b border-pink-200/50">
          <h1 className="text-base font-bold text-pink-950/80 tracking-wide">PENCARIAN BIAYA</h1>
        </div>
        <div className="text-center py-12 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-xs font-bold text-amber-900">Belum ada data setup</p>
          <p className="text-[10px] text-amber-800/70 mt-1">Buka tab Setting dulu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="pb-2 border-b border-pink-200/50">
        <h1 className="text-base font-bold text-pink-950/80 tracking-wide">PENCARIAN BIAYA</h1>
        <p className="text-[11px] text-pink-800/60 font-medium">Cari, edit & hapus transaksi</p>
      </div>

      {/* Filter Form */}
      <div className="glass-mini rounded-2xl p-3 border border-pink-200/60 shadow-sm space-y-2">
        <div className="relative">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyEnter}
            placeholder="Cari: 'seabank', 'makan', '50000'..."
            className="w-full bg-white/80 border border-pink-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium"
          />
          <span className="absolute left-2.5 top-2.5 text-xs text-pink-400">🔍</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <label className="block text-[9px] font-bold uppercase text-pink-900/70 mb-0.5">Bulan</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-[10px]"
            >
              <option value={0}>SEMUA</option>
              {BULAN_LIST.map((b, i) => (
                <option key={b} value={i + 1}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase text-pink-900/70 mb-0.5">Tahun</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-[10px]"
            >
              <option value={0}>SEMUA</option>
              {getTahunListDynamic().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase text-pink-900/70 mb-0.5">Urutan</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'DESC' | 'ASC')}
              className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-[10px]"
            >
              <option value="DESC">Terbaru</option>
              <option value="ASC">Terlama</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearchClick}
        disabled={fetching}
        className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 text-white font-semibold py-2.5 px-3 rounded-xl shadow-sm hover:shadow-md transition text-sm border border-pink-200/50"
      >
        {fetching ? '⏳ Mencari...' : '🔍 Cari Sekarang'}
      </button>

      {/* Swipe hint */}
      <p className="text-center text-[10px] text-pink-800/50 font-medium leading-relaxed -mt-1">
        💡 Geser kartu ke <b>kiri</b> → <b className="text-rose-600">Hapus</b> · ke <b>kanan</b> → <b className="text-blue-600">Edit</b>
      </p>

      {/* Error */}
      {error && (
        <div className="text-center text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl py-2 px-3">
          ❌ {error}
        </div>
      )}

      {/* Search Results */}
      {data && (
        <div className="glass-mini rounded-2xl p-3 border border-pink-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider">
              Hasil Pencarian ({data.totalCount})
            </h4>
            <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
              Total: {formatRupiah(data.totalNominal)}
            </span>
          </div>
          <div className="max-h-[450px] overflow-y-auto pr-1 space-y-2">
            {data.transactions.length === 0 ? (
              <p className="text-center text-xs text-pink-800/60 py-6 font-medium">
                Tidak ada transaksi yang ditemukan.
              </p>
            ) : (
              data.transactions.map((tx) => (
                <SwipeableTransactionCard
                  key={tx.id}
                  transaction={tx}
                  onEdit={() => setEditingTx(tx)}
                  onDelete={() => setPendingDelete(tx)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data && !error && !fetching && (
        <div className="glass-mini rounded-2xl p-3 border border-pink-200/60 text-center">
          <p className="text-xs text-pink-800/60 py-8">
            Masukkan kata kunci & atur filter,<br/>
            lalu klik <b>🔍 Cari Sekarang</b>.
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingTx && master && (
        <EditTransactionModal
          key={editingTx.id}
          transaction={editingTx}
          master={master}
          onClose={() => setEditingTx(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <DeleteConfirmModal
          transaction={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}

// ============================================================
// SUB-COMPONENT: SwipeableTransactionCard (Gmail-style swipe)
// ============================================================
function SwipeableTransactionCard({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: SearchTransaction
  onEdit: () => void
  onDelete: () => void
}) {
  const [openSide, setOpenSide] = useState<'left' | 'right' | null>(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const isHorizontalRef = useRef(false)

  const isIncome = transaction.type === 'income'
  const isTransfer = transaction.type === 'transfer_out' || transaction.type === 'transfer_in'
  const isInvestment = transaction.type === 'investment'

  let badgeColor = 'bg-rose-100 text-rose-800 border-rose-200/80'
  let sign = '-'
  let nominalColor = 'text-rose-700'

  if (isIncome) {
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200/80'
    sign = '+'
    nominalColor = 'text-emerald-700'
  } else if (isTransfer) {
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-200/80'
    sign = '⇄'
    nominalColor = 'text-blue-700'
  } else if (isInvestment) {
    badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200/80'
    sign = '↗'
    nominalColor = 'text-indigo-700'
  }

  function handlePointerDown(e: React.PointerEvent) {
    startXRef.current = e.clientX
    startYRef.current = e.clientY
    setIsDragging(false)
    isHorizontalRef.current = false
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (startXRef.current === 0) return
    const dx = e.clientX - startXRef.current
    const dy = e.clientY - startYRef.current

    if (!isHorizontalRef.current) {
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        isHorizontalRef.current = true
        setIsDragging(true)
      } else if (Math.abs(dy) > 12) {
        // Vertical scroll, ignore
        startXRef.current = 0
        return
      }
    }

    if (isHorizontalRef.current) {
      e.preventDefault()
      const clampedDx = Math.max(-SWIPE_OPEN_W, Math.min(SWIPE_OPEN_W, dx))
      setDragX(clampedDx)
    }
  }

  function handlePointerUp() {
    if (!isHorizontalRef.current) {
      // Tap on card: if open, close
      if (openSide) {
        setOpenSide(null)
        setDragX(0)
      }
    } else {
      // Determine final state
      if (dragX <= -SWIPE_OPEN_W * 0.45) {
        setOpenSide('right')
        setDragX(-SWIPE_OPEN_W)
      } else if (dragX >= SWIPE_OPEN_W * 0.45) {
        setOpenSide('left')
        setDragX(SWIPE_OPEN_W)
      } else {
        setOpenSide(null)
        setDragX(0)
      }
    }
    startXRef.current = 0
    isHorizontalRef.current = false
    setIsDragging(false)
  }

  function handleEditClick() {
    setOpenSide(null)
    setDragX(0)
    onEdit()
  }

  function handleDeleteClick() {
    setOpenSide(null)
    setDragX(0)
    onDelete()
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden select-none"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Action buttons (background, positioned absolutely behind card) */}
      {/* Edit button (left side, revealed when swiped right) */}
      <button
        onClick={handleEditClick}
        className="absolute left-0 top-0 bottom-0 w-[84px] z-0 bg-gradient-to-br from-blue-400 to-blue-600 text-white flex flex-col items-center justify-center gap-1"
        type="button"
      >
        <span className="text-lg">✏️</span>
        <span className="text-[9px] font-bold">EDIT</span>
      </button>

      {/* Delete button (right side, revealed when swiped left) */}
      <button
        onClick={handleDeleteClick}
        className="absolute right-0 top-0 bottom-0 w-[84px] z-0 bg-gradient-to-br from-rose-400 to-rose-600 text-white flex flex-col items-center justify-center gap-1"
        type="button"
      >
        <span className="text-lg">🗑️</span>
        <span className="text-[9px] font-bold">HAPUS</span>
      </button>

      {/* Card content (foreground, draggable, sits above buttons) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative z-10 bg-white/80 backdrop-blur-sm p-2.5 border border-pink-100/80 rounded-xl cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md border', badgeColor)}>
                {transaction.kategori}
              </span>
              <span className="text-[10px] font-bold text-pink-950/80 truncate">
                {transaction.display_label || transaction.subkategori || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-pink-900/60 font-medium">
              <span>{transaction.tgl}</span>
              <span>•</span>
              <span>🏦 {transaction.akun || '—'}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className={cn('text-xs font-black block', nominalColor)}>
              {sign} {formatRupiah(transaction.nominal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MODAL: Edit Transaction
// ============================================================
function EditTransactionModal({
  transaction,
  master,
  onClose,
  onSave,
}: {
  transaction: SearchTransaction
  master: SetupMaster
  onClose: () => void
  onSave: (updates: TransactionUpdate) => void
}) {
  // Parse existing transaction date (format "DD Mon YYYY" → YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10)

  // Compute initial values from props (no useEffect needed since key={transaction.id} remounts modal)
  const initialCat = master.categories.find(
    (c) => c.name === transaction.kategori ||
    `${c.icon ?? ''} ${c.name}`.trim() === transaction.kategori
  )
  const initialSub = initialCat && transaction.subkategori
    ? master.subcategories.find(
        (s) => s.category_id === initialCat.id && s.name === transaction.subkategori
      )
    : null
  const initialAcc = transaction.akun
    ? master.accounts.find((a) => a.name === transaction.akun)
    : null

  const [date, setDate] = useState(today)
  const [categoryId, setCategoryId] = useState(initialCat?.id ?? '')
  const [subcategoryId, setSubcategoryId] = useState(initialSub?.id ?? '')
  const [nominal, setNominal] = useState(String(transaction.nominal ?? ''))
  const [accountId, setAccountId] = useState(initialAcc?.id ?? '')
  const [toAccountId, setToAccountId] = useState('')
  const [note, setNote] = useState(transaction.subkategori ?? '')
  const [saving, setSaving] = useState(false)

  const selectedCategory = master.categories.find((c) => c.id === categoryId)
  const isPindahDana = selectedCategory?.type === 'transfer'
  const filteredSubs = filterSubcategoriesByCategory(master.subcategories, categoryId)
  const groupedAccounts = groupAccountsByType(master.accounts)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId || !accountId) {
      alert('Kategori dan akun wajib diisi')
      return
    }
    const cleanNominal = parseRupiah(nominal)
    if (!cleanNominal || cleanNominal <= 0) {
      alert('Nominal tidak valid')
      return
    }

    if (isPindahDana && (!toAccountId || toAccountId === accountId)) {
      alert('Pindah dana: pilih akun tujuan yang berbeda')
      return
    }

    setSaving(true)
    const txType = determineTransactionType(selectedCategory?.type)
    onSave({
      transaction_date: date,
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      account_id: accountId,
      to_account_id: isPindahDana ? toAccountId : null,
      amount: cleanNominal,
      type: txType,
      note: note.trim() || null,
    })
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/40 backdrop-blur-[5px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/95 w-full max-w-md rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto animate-pop">
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 sticky top-0 z-10">
          <h3 className="text-base font-bold text-white tracking-wide drop-shadow">✏️ Edit Transaksi Anda</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
          {/* Tanggal */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                setSubcategoryId('')
              }}
              required
              className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">-- Pilih Kategori --</option>
              {master.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sub Kategori (skip for PINDAH DANA) */}
          {categoryId && !isPindahDana && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
                Sub Kategori
              </label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
              >
                <option value="">-- Pilih Sub --</option>
                {filteredSubs.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Nominal — Sprint 3B: Rp prefix + auto separator */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
              Nominal
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-pink-700/60">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={nominal ? Number(nominal).toLocaleString('id-ID') : ''}
                onChange={(e) => setNominal(e.target.value.replace(/[^0-9]/g, ''))}
                required
                className="w-full bg-white/80 border border-pink-200 rounded-xl pl-10 pr-3.5 py-2 text-sm font-bold text-right"
              />
            </div>
          </div>

          {/* Akun Asal */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
              {isPindahDana ? '🏦 Dari Akun (Asal)' : '🏦 Akun'}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">-- Pilih Akun --</option>
              {groupedAccounts.cash.length > 0 && (
                <optgroup label="💵 CASH">
                  {groupedAccounts.cash.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </optgroup>
              )}
              {groupedAccounts.bank.length > 0 && (
                <optgroup label="🏦 BANK">
                  {groupedAccounts.bank.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </optgroup>
              )}
              {groupedAccounts.ewallet.length > 0 && (
                <optgroup label="📱 E-WALLET">
                  {groupedAccounts.ewallet.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </optgroup>
              )}
              {!isPindahDana && groupedAccounts.investment.length > 0 && (
                <optgroup label="💰 INVESTASI">
                  {groupedAccounts.investment.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Akun Tujuan (PINDAH DANA only) */}
          {isPindahDana && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
                🎯 Ke Akun (Tujuan)
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                required
                className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
              >
                <option value="">-- Pilih Tujuan --</option>
                {groupedAccounts.cash.length > 0 && (
                  <optgroup label="💵 CASH">
                    {groupedAccounts.cash
                      .filter((a) => a.id !== accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                  </optgroup>
                )}
                {groupedAccounts.bank.length > 0 && (
                  <optgroup label="🏦 BANK">
                    {groupedAccounts.bank
                      .filter((a) => a.id !== accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                  </optgroup>
                )}
                {groupedAccounts.ewallet.length > 0 && (
                  <optgroup label="📱 E-WALLET">
                    {groupedAccounts.ewallet
                      .filter((a) => a.id !== accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                  </optgroup>
                )}
                {groupedAccounts.investment.length > 0 && (
                  <optgroup label="💰 INVESTASI">
                    {groupedAccounts.investment
                      .filter((a) => a.id !== accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
              Catatan (opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan transaksi..."
              className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/90 text-pink-950 font-semibold py-2.5 px-4 rounded-xl border border-pink-200/80 shadow-sm transition text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition text-sm"
            >
              {saving ? '⏳...' : '💾 Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================
// MODAL: Delete Confirmation
// ============================================================
function DeleteConfirmModal({
  transaction,
  onCancel,
  onConfirm,
}: {
  transaction: SearchTransaction
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/40 backdrop-blur-[5px]"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white/95 w-full max-w-xs rounded-3xl p-5 text-center shadow-2xl animate-pop">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-rose-100 border border-rose-200">
          🗑️
        </div>
        <h3 className="text-sm font-bold text-rose-950 mb-2">Hapus Transaksi Anda?</h3>
        <div className="text-[11px] text-pink-900/80 font-semibold bg-pink-50 border border-pink-100 rounded-xl px-3 py-2 mb-2 leading-relaxed text-left">
          <div className="font-bold">{transaction.kategori}</div>
          <div>{transaction.subkategori || '—'}</div>
          <div className="text-pink-700">{formatRupiah(transaction.nominal)}</div>
          <div className="text-[10px] text-pink-700/70 mt-1">
            {transaction.tgl} · 🏦 {transaction.akun || '—'}
          </div>
        </div>
        <p className="text-[10px] text-rose-700/80 font-medium mb-4">
          Tindakan ini permanen & tidak dapat Anda batalkan.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/90 text-pink-950 text-xs font-semibold py-2.5 px-4 rounded-xl border border-pink-200/80 shadow-sm transition"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  )
}
