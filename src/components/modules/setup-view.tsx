'use client'

import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import {
  getSetupData,
  addAccount,
  updateAccount,
  deleteAccount,
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  type SetupData,
} from '@/lib/api/setup'
import { getBankOptions } from '@/lib/api/bank-options'
import type { Database } from '@/lib/types/database'
import { formatRupiah, parseRupiah, cn } from '@/lib/utils/format'

type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Subcategory = Database['public']['Tables']['subcategories']['Row']
type BankOption = Database['public']['Tables']['bank_options']['Row']

interface Props {
  user: User
  onClose: () => void
}

const CATEGORY_TYPES = [
  { value: 'income', label: '💵 Income (Pemasukan)' },
  { value: 'expense', label: '💸 Expense (Pengeluaran)' },
  { value: 'transfer', label: '🔁 Transfer (Pindah Dana)' },
  { value: 'investment', label: '💰 Investment (Investasi)' },
  { value: 'debt', label: '💳 Debt (Hutang/Cicilan)' },
  { value: 'other', label: '⚠️ Other (Lain-Lain)' },
]

const ACCOUNT_TYPES = [
  { value: 'bank', label: '🏦 Bank' },
  { value: 'ewallet', label: '📱 E-wallet' },
  { value: 'cash', label: '💵 Cash' },
  { value: 'investment', label: '💰 Investment' },
]

export default function SetupView({ user, onClose }: Props) {
  const [data, setData] = useState<SetupData | null>(null)
  const [bankOptions, setBankOptions] = useState<BankOption[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Modal state for adding new items
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddSubcategory, setShowAddSubcategory] = useState<string | null>(null) // category_id

  async function reload() {
    try {
      const [setupResult, banksResult] = await Promise.all([getSetupData(), getBankOptions()])
      if (setupResult.status === 'success') setData(setupResult)
      setBankOptions(banksResult)
    } catch (err) {
      console.error('Failed to load setup:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  // ============================================================
  // ACCOUNT HANDLERS
  // ============================================================

  async function handleUpdateOpeningBalance(account: Account, newBalance: number) {
    try {
      await updateAccount(account.id, { opening_balance: newBalance })
      await reload()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDeleteAccount(account: Account) {
    if (!confirm(`Hapus akun "${account.name}"? Transaksi terkait juga akan terhapus.`)) return
    try {
      await deleteAccount(account.id)
      await reload()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  // ============================================================
  // CATEGORY HANDLERS
  // ============================================================

  async function handleUpdateCategoryName(cat: Category, newName: string, newIcon: string) {
    try {
      await updateCategory(cat.id, { name: newName, icon: newIcon })
      await reload()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDeleteCategory(cat: Category) {
    if (!confirm(`Hapus kategori "${cat.name}" beserta semua subkategori?`)) return
    try {
      await deleteCategory(cat.id)
      await reload()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  // ============================================================
  // SUBCATEGORY HANDLERS
  // ============================================================

  async function handleUpdateSubcategory(sub: Subcategory, newName: string) {
    try {
      await updateSubcategory(sub.id, { name: newName })
      await reload()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDeleteSubcategory(sub: Subcategory) {
    if (!confirm(`Hapus subkategori "${sub.name}"?`)) return
    try {
      await deleteSubcategory(sub.id)
      await reload()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  // Group subcategories by category_id
  const subcategoriesByCategory = (data?.subcategories ?? []).reduce((acc, sub) => {
    if (!acc[sub.category_id]) acc[sub.category_id] = []
    acc[sub.category_id].push(sub)
    return acc
  }, {} as Record<string, Subcategory[]>)

  return (
    <div className="space-y-4">
      {/* Header with Edit Mode Toggle */}
      <div className="pb-2 border-b border-pink-200/50 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-pink-950/80 tracking-wide">⚙️ SETUP BUDGET</h1>
          <p className="text-[11px] text-pink-800/60 font-medium">
            Atur akun bank, kategori & budget bulanan
          </p>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-bold transition',
            editMode
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-pink-100 text-pink-900 hover:bg-pink-200'
          )}
        >
          {editMode ? '✓ Selesai' : '✏️ Edit'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mb-2"></div>
          <p className="text-xs text-pink-800/60 font-medium">Memuat data setup...</p>
        </div>
      )}

      {/* === SECTION 1: AKUN BANK === */}
      {data && (
        <section className="glass-mini rounded-2xl p-3 border border-pink-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider">
              🏦 Akun Bank & E-wallet
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                {data.accounts.filter(a => a.type !== 'investment').length} akun
              </span>
              {editMode && (
                <button
                  onClick={() => setShowAddAccount(true)}
                  className="text-[10px] font-bold text-white bg-pink-500 hover:bg-pink-600 px-2 py-0.5 rounded-full"
                >
                  + Tambah
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            {data.accounts.filter((a) => a.type !== 'investment').map((acc) => (
              <AccountRow
                key={`${acc.id}-${acc.opening_balance}`}
                account={acc}
                editMode={editMode}
                onUpdateBalance={handleUpdateOpeningBalance}
                onDelete={handleDeleteAccount}
              />
            ))}
            <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mt-2">
              <span className="text-[11px] font-bold text-emerald-900 uppercase">
                Total Saldo Awal
              </span>
              <span className="text-sm font-bold text-emerald-950">
                {formatRupiah(
                  data.accounts
                    .filter((a) => a.type !== 'investment')
                    .reduce((sum, a) => sum + a.opening_balance, 0)
                )}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* === SECTION 2: AKUN INVESTASI === */}
      {data && data.accounts.filter(a => a.type === 'investment').length > 0 && (
        <section className="glass-mini rounded-2xl p-3 border border-pink-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider">
              💰 Akun Investasi
            </h3>
            <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
              {data.accounts.filter(a => a.type === 'investment').length} akun
            </span>
          </div>
          <div className="space-y-1">
            {data.accounts.filter((a) => a.type === 'investment').map((acc) => (
              <AccountRow
                key={`${acc.id}-${acc.opening_balance}`}
                account={acc}
                editMode={editMode}
                onUpdateBalance={handleUpdateOpeningBalance}
                onDelete={handleDeleteAccount}
              />
            ))}
          </div>
        </section>
      )}

      {/* === SECTION 3: KATEGORI + SUBKATEGORI === */}
      {data && (
        <section className="glass-mini rounded-2xl p-3 border border-pink-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider">
              📋 Kategori & Sub-kategori
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                {data.categories.length} kategori · {data.subcategories.length} sub
              </span>
              {editMode && (
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="text-[10px] font-bold text-white bg-pink-500 hover:bg-pink-600 px-2 py-0.5 rounded-full"
                >
                  + Kategori
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            {data.categories.map((cat) => {
              const subs = subcategoriesByCategory[cat.id] ?? []
              const isExpanded = expandedCategory === cat.id
              return (
                <div key={cat.id} className="border border-pink-200/60 rounded-xl overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center gap-2 bg-white/70 px-3 py-2">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span className="text-lg">{cat.icon ?? '📁'}</span>
                      <span className="text-xs font-bold text-pink-950 flex-1 truncate">
                        {cat.name}
                      </span>
                      <span className="text-[9px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                        {subs.length} sub
                      </span>
                      <span className={`text-xs text-pink-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                    </button>
                    {editMode && (
                      <>
                        <button
                          onClick={() => setShowAddSubcategory(cat.id)}
                          className="text-[10px] font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 px-1.5 py-0.5 rounded"
                          title="Tambah subkategori"
                        >
                          + Sub
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded"
                          title="Hapus kategori"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                  {/* Subcategories (expandable) */}
                  {isExpanded && (
                    <div className="bg-pink-50/50 px-3 py-2 space-y-0.5 border-t border-pink-200/60">
                      {subs.length === 0 ? (
                        <p className="text-[10px] text-pink-700/50 italic py-1">
                          (Belum ada subkategori)
                        </p>
                      ) : (
                        subs.map((sub) => (
                          <SubcategoryRow
                            key={`${sub.id}-${sub.name}`}
                            subcategory={sub}
                            editMode={editMode}
                            onUpdateName={handleUpdateSubcategory}
                            onDelete={handleDeleteSubcategory}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Edit mode notice */}
      {!loading && !editMode && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800">
          <b>📌 Mode Read-Only.</b> Klik tombol <b>✏️ Edit</b> di kanan atas untuk:
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Ubah saldo awal akun bank</li>
            <li>Tambah / hapus akun (pilih dari 22 bank options)</li>
            <li>Tambah / hapus kategori</li>
            <li>Tambah / hapus subkategori per kategori</li>
          </ul>
          <p className="mt-2 text-amber-700">
            Set budget per subkategori akan diimplementasi di batch berikutnya.
          </p>
        </div>
      )}

      {/* === MODALS === */}

      {/* Modal: Add Account */}
      {showAddAccount && (
        <AddAccountModal
          userId={user.id}
          bankOptions={bankOptions}
          existingNames={data?.accounts.map(a => a.name) ?? []}
          onClose={() => setShowAddAccount(false)}
          onAdd={async (account) => {
            try {
              await addAccount(account)
              await reload()
              setShowAddAccount(false)
            } catch (err: any) {
              alert('Error: ' + err.message)
            }
          }}
        />
      )}

      {/* Modal: Add Category */}
      {showAddCategory && (
        <AddCategoryModal
          userId={user.id}
          existingNames={data?.categories.map(c => c.name) ?? []}
          onClose={() => setShowAddCategory(false)}
          onAdd={async (category) => {
            try {
              await addCategory(category)
              await reload()
              setShowAddCategory(false)
            } catch (err: any) {
              alert('Error: ' + err.message)
            }
          }}
        />
      )}

      {/* Modal: Add Subcategory */}
      {showAddSubcategory && (
        <AddSubcategoryModal
          userId={user.id}
          categoryId={showAddSubcategory}
          existingNames={
            data?.subcategories
              .filter(s => s.category_id === showAddSubcategory)
              .map(s => s.name) ?? []
          }
          onClose={() => setShowAddSubcategory(null)}
          onAdd={async (sub) => {
            try {
              await addSubcategory(sub)
              await reload()
              setShowAddSubcategory(null)
            } catch (err: any) {
              alert('Error: ' + err.message)
            }
          }}
        />
      )}
    </div>
  )
}

// ============================================================
// SUB-COMPONENT: AccountRow (with inline edit opening balance)
// ============================================================
function AccountRow({
  account,
  editMode,
  onUpdateBalance,
  onDelete,
}: {
  account: Account
  editMode: boolean
  onUpdateBalance: (account: Account, newBalance: number) => void
  onDelete: (account: Account) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempBalance, setTempBalance] = useState(String(account.opening_balance))

  function saveBalance() {
    const num = parseRupiah(tempBalance)
    onUpdateBalance(account, num)
    setIsEditing(false)
  }

  return (
    <div className="flex justify-between items-center bg-white/60 border border-pink-200/60 rounded-xl px-3 py-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-[9px] font-bold uppercase text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded shrink-0">
          {account.type}
        </span>
        <span className="text-sm font-semibold text-pink-950 truncate">{account.name}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {editMode && isEditing ? (
          <>
            <input
              type="text"
              inputMode="numeric"
              value={tempBalance}
              onChange={(e) => setTempBalance(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-24 text-right bg-white border border-pink-300 rounded px-2 py-0.5 text-xs font-bold"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveBalance()
                if (e.key === 'Escape') setIsEditing(false)
              }}
            />
            <button
              onClick={saveBalance}
              className="text-[10px] text-white bg-emerald-500 hover:bg-emerald-600 px-1.5 py-0.5 rounded font-bold"
              title="Simpan"
            >
              ✓
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-bold text-pink-950">
              {formatRupiah(account.opening_balance)}
            </span>
            {editMode && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[10px] text-pink-600 hover:bg-pink-100 px-1 py-0.5 rounded"
                  title="Edit saldo"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(account)}
                  className="text-[10px] text-rose-600 hover:bg-rose-100 px-1 py-0.5 rounded"
                  title="Hapus akun"
                >
                  🗑️
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================
// SUB-COMPONENT: SubcategoryRow (with inline edit name)
// ============================================================
function SubcategoryRow({
  subcategory,
  editMode,
  onUpdateName,
  onDelete,
}: {
  subcategory: Subcategory
  editMode: boolean
  onUpdateName: (sub: Subcategory, newName: string) => void
  onDelete: (sub: Subcategory) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(subcategory.name)

  function saveName() {
    if (tempName.trim() && tempName !== subcategory.name) {
      onUpdateName(subcategory, tempName.trim())
    }
    setIsEditing(false)
  }

  return (
    <div className="flex items-center justify-between py-1 px-2 hover:bg-white/50 rounded group">
      {editMode && isEditing ? (
        <>
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="flex-1 bg-white border border-pink-300 rounded px-2 py-0.5 text-[11px]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveName()
              if (e.key === 'Escape') setIsEditing(false)
            }}
          />
          <button
            onClick={saveName}
            className="text-[10px] text-white bg-emerald-500 hover:bg-emerald-600 px-1.5 py-0.5 rounded font-bold ml-1"
          >
            ✓
          </button>
        </>
      ) : (
        <>
          <span className="text-[11px] text-pink-900/80 flex-1">• {subcategory.name}</span>
          {editMode && (
            <div className="flex gap-0.5 opacity-60 group-hover:opacity-100 transition">
              <button
                onClick={() => setIsEditing(true)}
                className="text-[10px] text-pink-600 hover:bg-pink-100 px-1 py-0.5 rounded"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(subcategory)}
                className="text-[10px] text-rose-600 hover:bg-rose-100 px-1 py-0.5 rounded"
              >
                🗑️
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================
// MODAL: Add Account
// ============================================================
function AddAccountModal({
  userId,
  bankOptions,
  existingNames,
  onClose,
  onAdd,
}: {
  userId: string
  bankOptions: BankOption[]
  existingNames: string[]
  onClose: () => void
  onAdd: (account: Database['public']['Tables']['accounts']['Insert']) => void
}) {
  const [mode, setMode] = useState<'template' | 'custom'>('template')
  const [selectedBankId, setSelectedBankId] = useState('')
  const [customName, setCustomName] = useState('')
  const [customType, setCustomType] = useState<'bank' | 'ewallet' | 'cash' | 'investment'>('bank')
  const [openingBalance, setOpeningBalance] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let name = ''
    let type: 'bank' | 'ewallet' | 'cash' | 'investment' = 'bank'
    let sortOrder = 99

    if (mode === 'template') {
      const bank = bankOptions.find(b => b.id === selectedBankId)
      if (!bank) {
        alert('Pilih bank dulu')
        return
      }
      name = bank.name
      type = bank.type as any
      sortOrder = bank.sort_order
    } else {
      name = customName.trim()
      type = customType
      if (!name) {
        alert('Nama akun wajib diisi')
        return
      }
    }

    if (existingNames.some(n => n.toLowerCase() === name.toLowerCase())) {
      alert(`Akun "${name}" sudah ada. Hapus dulu atau pakai nama lain.`)
      return
    }

    onAdd({
      user_id: userId,
      name,
      type,
      opening_balance: parseRupiah(openingBalance),
      sort_order: sortOrder,
      is_active: true,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-pink-950/40 backdrop-blur-[5px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/95 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-pop">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 sticky top-0">
          <h3 className="text-base font-bold text-white tracking-wide drop-shadow">🏦 Tambah Akun</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
          {/* Mode switch */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('template')}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-bold border-2 transition',
                mode === 'template'
                  ? 'border-pink-500 bg-pink-50 text-pink-900'
                  : 'border-gray-200 text-gray-500'
              )}
            >
              📋 Dari Template
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-bold border-2 transition',
                mode === 'custom'
                  ? 'border-pink-500 bg-pink-50 text-pink-900'
                  : 'border-gray-200 text-gray-500'
              )}
            >
              ✏️ Custom
            </button>
          </div>

          {/* Template mode: pilih dari bank_options */}
          {mode === 'template' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
                Pilih Bank / E-wallet
              </label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                required
                className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
              >
                <option value="" disabled selected hidden>-- Pilih Bank --</option>
                <optgroup label="🏦 Bank Umum">
                  {bankOptions.filter(b => b.category === 'major-bank').map(b => (
                    <option key={b.id} value={b.id}>
                      {b.is_popular ? '⭐ ' : ''}{b.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="💻 Bank Digital">
                  {bankOptions.filter(b => b.category === 'digital-bank').map(b => (
                    <option key={b.id} value={b.id}>
                      {b.is_popular ? '⭐ ' : ''}{b.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="📱 E-wallet">
                  {bankOptions.filter(b => b.category === 'ewallet').map(b => (
                    <option key={b.id} value={b.id}>
                      {b.is_popular ? '⭐ ' : ''}{b.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="💵 Cash">
                  {bankOptions.filter(b => b.category === 'cash').map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* Custom mode: input manual */}
          {mode === 'custom' && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
                  Nama Akun
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Mis. Bank Daerah, Reksadana XXX"
                  required
                  className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
                  Tipe Akun
                </label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as any)}
                  className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
                >
                  {ACCOUNT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Opening balance (common) */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
              Saldo Awal (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={openingBalance}
              onChange={(e) => {
                const clean = e.target.value.replace(/[^0-9]/g, '')
                setOpeningBalance(clean)
              }}
              placeholder="0"
              className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm font-bold text-right"
            />
            {openingBalance && (
              <p className="text-[10px] text-pink-700 mt-0.5">
                = {formatRupiah(parseRupiah(openingBalance))}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm text-sm mt-2"
          >
            ➕ Tambah Akun
          </button>
        </form>
      </div>
    </div>
  )
}

// ============================================================
// MODAL: Add Category
// ============================================================
function AddCategoryModal({
  userId,
  existingNames,
  onClose,
  onAdd,
}: {
  userId: string
  existingNames: string[]
  onClose: () => void
  onAdd: (category: Database['public']['Tables']['categories']['Insert']) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'income' | 'expense' | 'transfer' | 'investment' | 'debt' | 'other'>('expense')
  const [icon, setIcon] = useState('📁')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      alert('Nama kategori wajib diisi')
      return
    }
    if (existingNames.some(n => n.toLowerCase() === name.toLowerCase())) {
      alert(`Kategori "${name}" sudah ada`)
      return
    }
    onAdd({
      user_id: userId,
      name: name.trim(),
      type,
      icon,
      sort_order: 99,
      is_active: true,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-pink-950/40 backdrop-blur-[5px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/95 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-pop">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 sticky top-0">
          <h3 className="text-base font-bold text-white tracking-wide drop-shadow">📋 Tambah Kategori</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
              Nama Kategori
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mis. LIBURAN, INVESTASI CRYPTO"
              required
              className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
              Tipe Kategori
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
            >
              {CATEGORY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
              Icon (emoji)
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📁"
              maxLength={4}
              className="w-16 bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm text-center"
            />
            <p className="text-[10px] text-pink-700/60 mt-1">
              Copy emoji dari emoji-cheat-sheet atau ketik manual
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm text-sm mt-2"
          >
            ➕ Tambah Kategori
          </button>
        </form>
      </div>
    </div>
  )
}

// ============================================================
// MODAL: Add Subcategory
// ============================================================
function AddSubcategoryModal({
  userId,
  categoryId,
  existingNames,
  onClose,
  onAdd,
}: {
  userId: string
  categoryId: string
  existingNames: string[]
  onClose: () => void
  onAdd: (sub: Database['public']['Tables']['subcategories']['Insert']) => void
}) {
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      alert('Nama subkategori wajib diisi')
      return
    }
    if (existingNames.some(n => n.toLowerCase() === name.toLowerCase())) {
      alert(`Subkategori "${name}" sudah ada di kategori ini`)
      return
    }
    onAdd({
      user_id: userId,
      category_id: categoryId,
      name: name.trim(),
      sort_order: 99,
      is_active: true,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-pink-950/40 backdrop-blur-[5px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/95 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-pop">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 sticky top-0">
          <h3 className="text-base font-bold text-white tracking-wide drop-shadow">➕ Tambah Subkategori</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
              Nama Subkategori
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mis. Gaji, Makanan, BBM"
              required
              className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm text-sm mt-2"
          >
            ➕ Tambah Subkategori
          </button>
        </form>
      </div>
    </div>
  )
}
