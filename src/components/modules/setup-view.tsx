'use client'

import type { User } from '@supabase/supabase-js'
import { useEffect, useMemo, useState } from 'react'
import {
  getSetupData,
  addAccount,
  updateAccount,
  deleteAccount,
  setAccountSelected,
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  setDefaultBudget,
  getDefaultBudget,
  type SetupData,
} from '@/lib/api/setup'
import { getBankOptions } from '@/lib/api/bank-options'
import type { Database } from '@/lib/types/database'
import { formatRupiah, parseRupiah, cn } from '@/lib/utils/format'

type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Subcategory = Database['public']['Tables']['subcategories']['Row']
type Budget = Database['public']['Tables']['budgets']['Row']
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

const ACCOUNT_GROUP_LABELS: Record<string, { icon: string; label: string }> = {
  cash: { icon: '💵', label: 'CASH' },
  bank: { icon: '🏦', label: 'BANK' },
  ewallet: { icon: '📱', label: 'E-WALLET' },
  investment: { icon: '💰', label: 'INVESTASI' },
}

export default function SetupView({ user, onClose }: Props) {
  const [data, setData] = useState<SetupData | null>(null)
  const [bankOptions, setBankOptions] = useState<BankOption[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [showHiddenAccounts, setShowHiddenAccounts] = useState(false)

  // Modal state for adding new items
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddSubcategory, setShowAddSubcategory] = useState<string | null>(null)

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
  // COMPUTED: Rekap Alokasi (default budgets)
  // ============================================================
  const rekapAlokasi = useMemo(() => {
    if (!data) return null

    // Group default budgets by category
    const categoryBudgets: Record<string, number> = {}
    let expectedIncome = 0
    let totalBudget = 0

    for (const cat of data.categories) {
      const subs = data.subcategories.filter((s) => s.category_id === cat.id)
      const catTotal = subs.reduce((sum, sub) => {
        const budget = getDefaultBudget(data.budgets, sub.id)
        return sum + budget
      }, 0)
      categoryBudgets[cat.id] = catTotal

      // Income categories contribute to expected income
      if (cat.type === 'income') {
        expectedIncome += catTotal
      } else {
        totalBudget += catTotal
      }
    }

    const sisaBudget = expectedIncome - totalBudget
    const sisaPct = expectedIncome > 0 ? (sisaBudget / expectedIncome) * 100 : 0

    return {
      categoryBudgets,
      expectedIncome,
      totalBudget,
      sisaBudget,
      sisaPct,
    }
  }, [data])

  // ============================================================
  // COMPUTED: Grouped accounts (cash → bank → ewallet → investment, alphabetical)
  // ============================================================
  const groupedAccounts = useMemo(() => {
    if (!data) return { visible: {}, hidden: {} }

    const visible: Record<string, Account[]> = {}
    const hidden: Record<string, Account[]> = {}

    for (const acc of data.accounts) {
      const target = acc.is_selected ? visible : hidden
      if (!target[acc.type]) target[acc.type] = []
      target[acc.type].push(acc)
    }

    // Sort each group alphabetically by name
    for (const group of [visible, hidden]) {
      for (const type of Object.keys(group)) {
        group[type].sort((a, b) => a.name.localeCompare(b.name))
      }
    }

    return { visible, hidden }
  }, [data])

  // Group subcategories by category_id
  const subcategoriesByCategory = useMemo(() => {
    const map: Record<string, Subcategory[]> = {}
    for (const sub of data?.subcategories ?? []) {
      if (!map[sub.category_id]) map[sub.category_id] = []
      map[sub.category_id].push(sub)
    }
    return map
  }, [data])

  // ============================================================
  // HANDLERS
  // ============================================================

  async function handleUpdateOpeningBalance(account: Account, newBalance: number) {
    try {
      await updateAccount(account.id, { opening_balance: newBalance })
      await reload()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleToggleAccountSelected(account: Account) {
    try {
      await setAccountSelected(account.id, !account.is_selected)
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

  async function handleSetBudget(sub: Subcategory, amount: number) {
    try {
      await setDefaultBudget(user.id, sub.id, amount)
      await reload()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mb-2"></div>
        <p className="text-xs text-pink-800/60 font-medium">Memuat data setup...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-rose-700">Gagal memuat data setup</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Edit Mode Toggle */}
      <div className="pb-2 border-b border-pink-200/50 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-pink-950/80 tracking-wide">⚙️ SETUP BUDGET</h1>
          <p className="text-[11px] text-pink-800/60 font-medium">
            Atur akun, kategori & budget bulanan
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

      {/* === SECTION: REKAP ALOKASI === */}
      {rekapAlokasi && (
        <section className="rounded-2xl p-3 border border-amber-300/60 shadow-sm bg-amber-50/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-amber-900/80 uppercase tracking-wider">
              🧾 Rekap Alokasi Budget
            </h3>
            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              otomatis
            </span>
          </div>
          <div className="space-y-0.5">
            {data.categories.map((cat) => {
              const catBudget = rekapAlokasi.categoryBudgets[cat.id] ?? 0
              const pct = rekapAlokasi.expectedIncome > 0 && cat.type !== 'income'
                ? (catBudget / rekapAlokasi.expectedIncome) * 100
                : 0
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-1 border-b border-amber-200/40 last:border-0"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm">{cat.icon ?? '📁'}</span>
                    <span className="text-[11px] font-semibold text-pink-950 truncate">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-pink-700/60 font-medium">
                      {cat.type === 'income' ? '' : pct > 0 ? `${pct.toFixed(1)}%` : ''}
                    </span>
                    <span className={cn(
                      'text-xs font-bold',
                      cat.type === 'income' ? 'text-emerald-700' : 'text-pink-950'
                    )}>
                      {formatRupiah(catBudget)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Sisa Budget summary */}
          <div className={cn(
            'mt-2 p-2.5 rounded-xl border flex items-center justify-between',
            rekapAlokasi.sisaBudget >= 0
              ? 'bg-emerald-100/70 border-emerald-300/60'
              : 'bg-rose-100/70 border-rose-300/60'
          )}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider">
                {rekapAlokasi.sisaBudget >= 0 ? '✓ Sisa Budget' : '⚠ Over Budget'}
              </p>
              <p className="text-[9px] text-pink-700/60 mt-0.5">
                dari {formatRupiah(rekapAlokasi.expectedIncome)} pemasukan
              </p>
            </div>
            <div className="text-right">
              <p className={cn(
                'text-sm font-black',
                rekapAlokasi.sisaBudget >= 0 ? 'text-emerald-800' : 'text-rose-800'
              )}>
                {formatRupiah(rekapAlokasi.sisaBudget)}
              </p>
              <p className="text-[9px] font-bold text-pink-700/60">
                {rekapAlokasi.sisaPct > 0 ? `${rekapAlokasi.sisaPct.toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* === SECTION: AKUN BANK (Grouped) === */}
      <section className="glass-mini rounded-2xl p-3 border border-pink-200/60 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider">
            🏦 Akun Bank & E-wallet
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
              {Object.values(groupedAccounts.visible).flat().filter(a => a.type !== 'investment').length} aktif
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

        {/* Visible accounts grouped by type */}
        {['cash', 'bank', 'ewallet'].map((type) => {
          const accounts = groupedAccounts.visible[type] ?? []
          if (accounts.length === 0) return null
          const groupLabel = ACCOUNT_GROUP_LABELS[type]
          return (
            <div key={type} className="mb-2 last:mb-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-pink-700/60 mb-1 px-1">
                {groupLabel.icon} {groupLabel.label}
              </p>
              <div className="space-y-1">
                {accounts.map((acc) => (
                  <AccountRow
                    key={`${acc.id}-${acc.opening_balance}-${acc.is_selected}`}
                    account={acc}
                    editMode={editMode}
                    onUpdateBalance={handleUpdateOpeningBalance}
                    onDelete={handleDeleteAccount}
                    onToggleSelected={handleToggleAccountSelected}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Total Saldo Awal */}
        <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mt-2">
          <span className="text-[11px] font-bold text-emerald-900 uppercase">
            Total Saldo Awal (aktif)
          </span>
          <span className="text-sm font-bold text-emerald-950">
            {formatRupiah(
              Object.values(groupedAccounts.visible)
                .flat()
                .filter((a) => a.type !== 'investment')
                .reduce((sum, a) => sum + a.opening_balance, 0)
            )}
          </span>
        </div>

        {/* Hidden accounts section (edit mode only) */}
        {editMode && (() => {
          const hiddenNonInvestment = (groupedAccounts.hidden['cash'] ?? [])
            .concat(groupedAccounts.hidden['bank'] ?? [])
            .concat(groupedAccounts.hidden['ewallet'] ?? [])
          if (hiddenNonInvestment.length === 0) return null
          return (
            <div className="mt-3 pt-2 border-t border-pink-200/40">
              <button
                onClick={() => setShowHiddenAccounts(!showHiddenAccounts)}
                className="text-[10px] font-bold text-pink-700/70 hover:text-pink-900 flex items-center gap-1"
              >
                {showHiddenAccounts ? '▼' : '▶'} Akun Tersembunyi ({hiddenNonInvestment.length})
              </button>
              {showHiddenAccounts && (
                <div className="mt-2 space-y-1">
                  {hiddenNonInvestment.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[9px] font-bold uppercase text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {acc.type}
                        </span>
                        <span className="text-sm font-semibold text-gray-500 truncate">
                          {acc.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">
                          {formatRupiah(acc.opening_balance)}
                        </span>
                        <button
                          onClick={() => handleToggleAccountSelected(acc)}
                          className="text-[10px] text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded font-bold"
                          title="Tampilkan akun ini"
                        >
                          ✓ Tampilkan
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc)}
                          className="text-[10px] text-rose-600 hover:bg-rose-100 px-1 py-0.5 rounded"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
      </section>

      {/* === SECTION: AKUN INVESTASI (Grouped, sorted) === */}
      {(groupedAccounts.visible['investment'] ?? []).length > 0 && (
        <section className="glass-mini rounded-2xl p-3 border border-pink-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider">
              💰 Akun Investasi
            </h3>
            <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
              {(groupedAccounts.visible['investment'] ?? []).length} aktif
            </span>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-pink-700/60 mb-1 px-1">
            💰 INVESTASI
          </p>
          <div className="space-y-1">
            {(groupedAccounts.visible['investment'] ?? []).map((acc) => (
              <AccountRow
                key={`${acc.id}-${acc.opening_balance}-${acc.is_selected}`}
                account={acc}
                editMode={editMode}
                onUpdateBalance={handleUpdateOpeningBalance}
                onDelete={handleDeleteAccount}
                onToggleSelected={handleToggleAccountSelected}
              />
            ))}
          </div>

          {/* Hidden investment accounts */}
          {editMode && (groupedAccounts.hidden['investment'] ?? []).length > 0 && (
            <div className="mt-3 pt-2 border-t border-pink-200/40">
              <p className="text-[9px] font-bold text-pink-700/60 mb-1 px-1">
                Tersembunyi ({(groupedAccounts.hidden['investment'] ?? []).length})
              </p>
              <div className="space-y-1">
                {(groupedAccounts.hidden['investment'] ?? []).map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
                  >
                    <span className="text-sm font-semibold text-gray-500 truncate">
                      {acc.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleAccountSelected(acc)}
                        className="text-[10px] text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded font-bold"
                      >
                        ✓ Tampilkan
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(acc)}
                        className="text-[10px] text-rose-600 hover:bg-rose-100 px-1 py-0.5 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* === SECTION: KATEGORI + SUBKATEGORI (with budget) === */}
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
            const catBudget = rekapAlokasi?.categoryBudgets[cat.id] ?? 0
            return (
              <div key={cat.id} className="border border-pink-200/60 rounded-xl overflow-hidden">
                {/* Category header */}
                <div className="flex items-center gap-2 bg-white/70 px-3 py-2">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                    className="flex items-center gap-2 flex-1 text-left min-w-0"
                  >
                    <span className="text-lg shrink-0">{cat.icon ?? '📁'}</span>
                    <span className="text-xs font-bold text-pink-950 flex-1 truncate">
                      {cat.name}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                      {formatRupiah(catBudget)}
                    </span>
                    <span className="text-[9px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full shrink-0">
                      {subs.length} sub
                    </span>
                    <span className={`text-xs text-pink-600 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </button>
                  {editMode && (
                    <>
                      <button
                        onClick={() => setShowAddSubcategory(cat.id)}
                        className="text-[10px] font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 px-1.5 py-0.5 rounded shrink-0"
                        title="Tambah subkategori"
                      >
                        + Sub
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded shrink-0"
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
                        {cat.type === 'transfer'
                          ? '(Pindah dana pakai akun yang dipilih, nggak perlu subkategori)'
                          : '(Belum ada subkategori)'}
                      </p>
                    ) : (
                      subs.map((sub) => (
                        <SubcategoryRow
                          key={`${sub.id}-${sub.name}`}
                          subcategory={sub}
                          budget={getDefaultBudget(data.budgets, sub.id)}
                          editMode={editMode}
                          onUpdateName={handleUpdateSubcategory}
                          onDelete={handleDeleteSubcategory}
                          onSetBudget={handleSetBudget}
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

      {/* Edit mode notice */}
      {!editMode && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800">
          <b>📌 Klik tombol ✏️ Edit untuk:</b>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Ubah saldo awal akun bank (klik ✏️ per akun)</li>
            <li>Tambah / hapus akun (pilih dari 22 bank options)</li>
            <li>Tampilkan / sembunyikan akun (toggle)</li>
            <li>Tambah / hapus kategori & subkategori</li>
            <li>Set budget default per subkategori (sticky, berlaku semua bulan)</li>
          </ul>
        </div>
      )}

      {/* === MODALS === */}
      {showAddAccount && (
        <AddAccountModal
          userId={user.id}
          bankOptions={bankOptions}
          existingNames={data.accounts.map(a => a.name)}
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

      {showAddCategory && (
        <AddCategoryModal
          userId={user.id}
          existingNames={data.categories.map(c => c.name)}
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

      {showAddSubcategory && (
        <AddSubcategoryModal
          userId={user.id}
          categoryId={showAddSubcategory}
          existingNames={
            data.subcategories
              .filter(s => s.category_id === showAddSubcategory)
              .map(s => s.name)
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
// SUB-COMPONENT: AccountRow (with edit balance + toggle selected)
// ============================================================
function AccountRow({
  account,
  editMode,
  onUpdateBalance,
  onDelete,
  onToggleSelected,
}: {
  account: Account
  editMode: boolean
  onUpdateBalance: (account: Account, newBalance: number) => void
  onDelete: (account: Account) => void
  onToggleSelected: (account: Account) => void
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
                  onClick={() => onToggleSelected(account)}
                  className="text-[10px] text-amber-600 hover:bg-amber-100 px-1 py-0.5 rounded"
                  title="Sembunyikan akun"
                >
                  🙈
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
// SUB-COMPONENT: SubcategoryRow (with inline edit name + budget)
// ============================================================
function SubcategoryRow({
  subcategory,
  budget,
  editMode,
  onUpdateName,
  onDelete,
  onSetBudget,
}: {
  subcategory: Subcategory
  budget: number
  editMode: boolean
  onUpdateName: (sub: Subcategory, newName: string) => void
  onDelete: (sub: Subcategory) => void
  onSetBudget: (sub: Subcategory, amount: number) => void
}) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(subcategory.name)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [tempBudget, setTempBudget] = useState(String(budget))

  function saveName() {
    if (tempName.trim() && tempName !== subcategory.name) {
      onUpdateName(subcategory, tempName.trim())
    }
    setIsEditingName(false)
  }

  function saveBudget() {
    const num = parseRupiah(tempBudget)
    onSetBudget(subcategory, num)
    setIsEditingBudget(false)
  }

  return (
    <div className="flex items-center justify-between py-1 px-2 hover:bg-white/50 rounded group">
      {/* Name (left side) */}
      {editMode && isEditingName ? (
        <>
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="flex-1 bg-white border border-pink-300 rounded px-2 py-0.5 text-[11px] mr-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveName()
              if (e.key === 'Escape') setIsEditingName(false)
            }}
          />
          <button
            onClick={saveName}
            className="text-[10px] text-white bg-emerald-500 hover:bg-emerald-600 px-1.5 py-0.5 rounded font-bold"
          >
            ✓
          </button>
        </>
      ) : (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-[11px] text-pink-900/80 truncate flex-1">• {subcategory.name}</span>
          {editMode && (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-[10px] text-pink-600 hover:bg-pink-100 px-1 py-0.5 rounded opacity-60 group-hover:opacity-100"
              title="Edit nama"
            >
              ✏️
            </button>
          )}
        </div>
      )}

      {/* Budget (right side) */}
      {editMode && isEditingBudget ? (
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="text"
            inputMode="numeric"
            value={tempBudget}
            onChange={(e) => setTempBudget(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0"
            className="w-20 text-right bg-white border border-pink-300 rounded px-2 py-0.5 text-[10px] font-bold"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveBudget()
              if (e.key === 'Escape') setIsEditingBudget(false)
            }}
          />
          <button
            onClick={saveBudget}
            className="text-[10px] text-white bg-emerald-500 hover:bg-emerald-600 px-1.5 py-0.5 rounded font-bold"
          >
            ✓
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          {editMode && (
            <>
              <span className="text-[10px] font-bold text-pink-700/80 bg-pink-100 px-1.5 py-0.5 rounded">
                {budget > 0 ? formatRupiah(budget) : '—'}
              </span>
              <button
                onClick={() => setIsEditingBudget(true)}
                className="text-[10px] text-emerald-600 hover:bg-emerald-100 px-1 py-0.5 rounded opacity-60 group-hover:opacity-100"
                title="Set budget default"
              >
                💰
              </button>
              <button
                onClick={() => onDelete(subcategory)}
                className="text-[10px] text-rose-600 hover:bg-rose-100 px-1 py-0.5 rounded opacity-60 group-hover:opacity-100"
                title="Hapus subkategori"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// MODAL: Add Account (template or custom)
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
      is_selected: true,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-pink-950/40 backdrop-blur-[5px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/95 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-pop">
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 sticky top-0">
          <h3 className="text-base font-bold text-white tracking-wide drop-shadow">🏦 Tambah Akun</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
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
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

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

          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
              Saldo Awal (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm font-bold text-right"
            />
            {openingBalance && (
              <p className="text-[10px] text-pink-700 mt-0.5">
                = {formatRupiah(parseRupiah(openingBalance))}
              </p>
            )}
          </div>

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
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 sticky top-0">
          <h3 className="text-base font-bold text-white tracking-wide drop-shadow">📋 Tambah Kategori</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

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
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 sticky top-0">
          <h3 className="text-base font-bold text-white tracking-wide drop-shadow">➕ Tambah Subkategori</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

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
