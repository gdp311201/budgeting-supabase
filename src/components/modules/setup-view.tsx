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

export default function SetupView({ user, onClose }: Props) {
  const [data, setData] = useState<SetupData | null>(null)
  const [bankOptions, setBankOptions] = useState<BankOption[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Modal state for adding new items
  const [showAddAccountBank, setShowAddAccountBank] = useState(false)
  const [showAddAccountEwallet, setShowAddAccountEwallet] = useState(false)
  const [showAddAccountInvestment, setShowAddAccountInvestment] = useState(false)
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
  const rekapAlokasi = (() => {
    if (!data) return null

    const categoryBudgets: Record<string, number> = {}
    let expectedIncome = 0
    let totalBudget = 0

    for (const cat of data.categories) {
      if (cat.type === 'transfer') continue // Skip PINDAH DANA
      const subs = data.subcategories.filter((s) => s.category_id === cat.id)
      const catTotal = subs.reduce((sum, sub) => {
        const budget = getDefaultBudget(data.budgets, sub.id)
        return sum + budget
      }, 0)
      categoryBudgets[cat.id] = catTotal

      if (cat.type === 'income') {
        expectedIncome += catTotal
      } else {
        totalBudget += catTotal
      }
    }

    const sisaBudget = expectedIncome - totalBudget
    const sisaPct = expectedIncome > 0 ? (sisaBudget / expectedIncome) * 100 : 0

    return { categoryBudgets, expectedIncome, totalBudget, sisaBudget, sisaPct }
  })()

  // ============================================================
  // COMPUTED: Grouped accounts
  // ============================================================
  const cashAccounts = data?.accounts.filter(a => a.type === 'cash') ?? []
  const bankAccounts = data?.accounts
    .filter(a => a.type === 'bank' && a.is_selected)
    .sort((a, b) => a.name.localeCompare(b.name)) ?? []
  const ewalletAccounts = data?.accounts
    .filter(a => a.type === 'ewallet' && a.is_selected)
    .sort((a, b) => a.name.localeCompare(b.name)) ?? []
  const investmentAccounts = data?.accounts
    .filter(a => a.type === 'investment' && a.is_selected)
    .sort((a, b) => a.name.localeCompare(b.name)) ?? []

  // Group subcategories by category_id
  const subcategoriesByCategory = (() => {
    const map: Record<string, Subcategory[]> = {}
    for (const sub of data?.subcategories ?? []) {
      if (!map[sub.category_id]) map[sub.category_id] = []
      map[sub.category_id].push(sub)
    }
    return map
  })()

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

  // Get available bank options (not yet selected by user)
  const getAvailableBanks = (type: 'bank' | 'ewallet') => {
    const userAccountNames = data.accounts.map(a => a.name)
    return bankOptions.filter(b => b.type === type && !userAccountNames.includes(b.name))
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
            {data.categories
              .filter(cat => cat.type !== 'transfer') // Skip PINDAH DANA
              .map((cat) => {
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

      {/* === SECTION: AKUN (CASH + BANK + E-WALLET) === */}
      <section className="glass-mini rounded-2xl p-3 border border-pink-200/60 shadow-sm">
        <h3 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider mb-2">
          🏦 Akun Bank & E-wallet
        </h3>

        {/* 💵 CASH (permanen, hanya edit opening balance) */}
        <p className="text-[9px] font-bold uppercase tracking-wider text-pink-700/60 mb-1 px-1">
          💵 CASH
        </p>
        <div className="space-y-1 mb-3">
          {cashAccounts.map((acc) => (
            <AccountRow
              key={`${acc.id}-${acc.opening_balance}`}
              account={acc}
              editMode={editMode}
              onUpdateBalance={handleUpdateOpeningBalance}
              onDelete={handleDeleteAccount}
            />
          ))}
          {cashAccounts.length === 0 && (
            <p className="text-[10px] text-pink-700/50 italic px-2 py-1">
              CASH akan otomatis dibuat saat signup
            </p>
          )}
        </div>

        {/* 🏦 BANK (dropdown picker) */}
        <p className="text-[9px] font-bold uppercase tracking-wider text-pink-700/60 mb-1 px-1">
          🏦 BANK
        </p>
        <div className="space-y-1 mb-2">
          {bankAccounts.map((acc) => (
            <AccountRow
              key={`${acc.id}-${acc.opening_balance}`}
              account={acc}
              editMode={editMode}
              onUpdateBalance={handleUpdateOpeningBalance}
              onDelete={handleDeleteAccount}
            />
          ))}
          {bankAccounts.length === 0 && (
            <p className="text-[10px] text-pink-700/50 italic px-2 py-1">
              Belum ada bank dipilih
            </p>
          )}
        </div>
        {editMode && (
          <button
            onClick={() => setShowAddAccountBank(true)}
            className="w-full text-[10px] font-bold text-white bg-pink-500 hover:bg-pink-600 py-1.5 rounded-xl mb-3"
          >
            + Tambah Bank
          </button>
        )}

        {/* 📱 E-WALLET (dropdown picker) */}
        <p className="text-[9px] font-bold uppercase tracking-wider text-pink-700/60 mb-1 px-1">
          📱 E-WALLET
        </p>
        <div className="space-y-1 mb-2">
          {ewalletAccounts.map((acc) => (
            <AccountRow
              key={`${acc.id}-${acc.opening_balance}`}
              account={acc}
              editMode={editMode}
              onUpdateBalance={handleUpdateOpeningBalance}
              onDelete={handleDeleteAccount}
            />
          ))}
          {ewalletAccounts.length === 0 && (
            <p className="text-[10px] text-pink-700/50 italic px-2 py-1">
              Belum ada e-wallet dipilih
            </p>
          )}
        </div>
        {editMode && (
          <button
            onClick={() => setShowAddAccountEwallet(true)}
            className="w-full text-[10px] font-bold text-white bg-pink-500 hover:bg-pink-600 py-1.5 rounded-xl"
          >
            + Tambah E-wallet
          </button>
        )}

        {/* Total Saldo Awal */}
        <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mt-2">
          <span className="text-[11px] font-bold text-emerald-900 uppercase">
            Total Saldo Awal
          </span>
          <span className="text-sm font-bold text-emerald-950">
            {formatRupiah(
              [...cashAccounts, ...bankAccounts, ...ewalletAccounts]
                .reduce((sum, a) => sum + a.opening_balance, 0)
            )}
          </span>
        </div>
      </section>

      {/* === SECTION: KATEGORI + SUBKATEGORI === */}
      <section className="glass-mini rounded-2xl p-3 border border-pink-200/60 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider">
            📋 Kategori & Sub-kategori
          </h3>
          {editMode && (
            <button
              onClick={() => setShowAddCategory(true)}
              className="text-[10px] font-bold text-white bg-pink-500 hover:bg-pink-600 px-2 py-0.5 rounded-full"
            >
              + Kategori
            </button>
          )}
        </div>
        <div className="space-y-1">
          {data.categories
            .filter(cat => cat.type !== 'transfer') // Hide PINDAH DANA
            .map((cat) => {
              const subs = subcategoriesByCategory[cat.id] ?? []
              const isExpanded = expandedCategory === cat.id
              const catBudget = rekapAlokasi?.categoryBudgets[cat.id] ?? 0
              const isDefaultCategory = cat.sort_order <= 12
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
                        {!isDefaultCategory && (
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded shrink-0"
                            title="Hapus kategori (custom only)"
                          >
                            🗑️
                          </button>
                        )}
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
            <li>Ubah saldo awal akun (klik ✏️ per akun)</li>
            <li>Tambah / hapus bank & e-wallet</li>
            <li>Tambah kategori & subkategori custom</li>
            <li>Set budget default per subkategori (sticky)</li>
            <li>Edit saldo investasi (auto-link ke akun)</li>
          </ul>
        </div>
      )}

      {/* === MODALS === */}
      {showAddAccountBank && (
        <AddAccountModal
          mode="bank"
          userId={user.id}
          bankOptions={getAvailableBanks('bank')}
          existingNames={data.accounts.map(a => a.name)}
          onClose={() => setShowAddAccountBank(false)}
          onAdd={async (account) => {
            try {
              await addAccount(account)
              await reload()
              setShowAddAccountBank(false)
            } catch (err: any) {
              alert('Error: ' + err.message)
            }
          }}
        />
      )}

      {showAddAccountEwallet && (
        <AddAccountModal
          mode="ewallet"
          userId={user.id}
          bankOptions={getAvailableBanks('ewallet')}
          existingNames={data.accounts.map(a => a.name)}
          onClose={() => setShowAddAccountEwallet(false)}
          onAdd={async (account) => {
            try {
              await addAccount(account)
              await reload()
              setShowAddAccountEwallet(false)
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
// SUB-COMPONENT: AccountRow (with edit opening balance)
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
                {!account.is_protected && (
                  <button
                    onClick={() => onDelete(account)}
                    className="text-[10px] text-rose-600 hover:bg-rose-100 px-1 py-0.5 rounded"
                    title="Hapus akun"
                  >
                    🗑️
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================
// SUB-COMPONENT: SubcategoryRow (with budget + investment balance)
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
      {editMode && (
        <div className="flex items-center gap-1 shrink-0">
          {isEditingBudget ? (
            <>
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
            </>
          ) : (
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
              {subcategory.is_custom && (
                <button
                  onClick={() => onDelete(subcategory)}
                  className="text-[10px] text-rose-600 hover:bg-rose-100 px-1 py-0.5 rounded opacity-60 group-hover:opacity-100"
                  title="Hapus subkategori (custom)"
                >
                  🗑️
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// MODAL: Add Account (Bank or E-wallet, template only)
// ============================================================
function AddAccountModal({
  mode,
  userId,
  bankOptions,
  existingNames,
  onClose,
  onAdd,
}: {
  mode: 'bank' | 'ewallet'
  userId: string
  bankOptions: BankOption[]
  existingNames: string[]
  onClose: () => void
  onAdd: (account: Database['public']['Tables']['accounts']['Insert']) => void
}) {
  const [selectedBankId, setSelectedBankId] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const bank = bankOptions.find(b => b.id === selectedBankId)
    if (!bank) {
      alert('Pilih bank dulu')
      return
    }

    if (existingNames.some(n => n.toLowerCase() === bank.name.toLowerCase())) {
      alert(`Akun "${bank.name}" sudah ada.`)
      return
    }

    onAdd({
      user_id: userId,
      name: bank.name,
      type: mode as 'bank' | 'ewallet',
      opening_balance: parseRupiah(openingBalance),
      sort_order: bank.sort_order,
      is_active: true,
      is_selected: true,
      is_protected: false,
    })
  }

  const label = mode === 'bank' ? 'Bank' : 'E-wallet'
  const icon = mode === 'bank' ? '🏦' : '📱'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-pink-950/40 backdrop-blur-[5px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/95 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-pop">
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500 sticky top-0">
          <h3 className="text-base font-bold text-white tracking-wide drop-shadow">
            {icon} Tambah {label}
          </h3>
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
              Pilih {label}
            </label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              required
              className="w-full bg-white/80 border border-pink-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="" disabled selected hidden>-- Pilih {label} --</option>
              {bankOptions.length === 0 ? (
                <option disabled>Semua {label} udah dipilih</option>
              ) : (
                bankOptions.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.is_popular ? '⭐ ' : ''}{b.name}
                  </option>
                ))
              )}
            </select>
            {bankOptions.length === 0 && (
              <p className="text-[10px] text-amber-700 mt-1">
                ⚠️ Semua {label} dari template udah lu pilih. Hapus salah satu dulu kalau mau ganti.
              </p>
            )}
          </div>

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
            disabled={bankOptions.length === 0}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm text-sm mt-2"
          >
            ➕ Tambah {label}
          </button>
        </form>
      </div>
    </div>
  )
}

// ============================================================
// MODAL: Add Category (custom)
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
      sort_order: 99, // Custom category (sort_order > 12)
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
// MODAL: Add Subcategory (custom)
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
      is_custom: true, // ← Mark as custom (can be deleted)
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
