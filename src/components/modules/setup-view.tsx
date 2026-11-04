'use client'

import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { getSetupData, type SetupData } from '@/lib/api/setup'
import { formatRupiah } from '@/lib/utils/format'

interface Props {
  user: User
  onClose: () => void
}

export default function SetupView({ user, onClose }: Props) {
  const [data, setData] = useState<SetupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const result = await getSetupData()
        if (result.status === 'success') {
          setData(result)
        }
      } catch (err) {
        console.error('Failed to load setup:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Group subcategories by category_id
  const subcategoriesByCategory = (data?.subcategories ?? []).reduce((acc, sub) => {
    if (!acc[sub.category_id]) acc[sub.category_id] = []
    acc[sub.category_id].push(sub)
    return acc
  }, {} as Record<string, typeof data.subcategories>)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-2 border-b border-pink-200/50">
        <h1 className="text-base font-bold text-pink-950/80 tracking-wide">⚙️ SETUP BUDGET</h1>
        <p className="text-[11px] text-pink-800/60 font-medium">
          Atur akun bank, kategori & budget bulanan
        </p>
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
            <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
              {data.accounts.filter(a => a.type !== 'investment').length} akun
            </span>
          </div>
          <div className="space-y-1">
            {data.accounts.filter((a) => a.type !== 'investment').map((acc) => (
              <div
                key={acc.id}
                className="flex justify-between items-center bg-white/60 border border-pink-200/60 rounded-xl px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded">
                    {acc.type}
                  </span>
                  <span className="text-sm font-semibold text-pink-950">{acc.name}</span>
                </div>
                <span className="text-sm font-bold text-pink-950">
                  {formatRupiah(acc.opening_balance)}
                </span>
              </div>
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
              <div
                key={acc.id}
                className="flex justify-between items-center bg-white/60 border border-pink-200/60 rounded-xl px-3 py-2"
              >
                <span className="text-sm font-semibold text-pink-950">{acc.name}</span>
                <span className="text-sm font-bold text-pink-950">
                  {formatRupiah(acc.opening_balance)}
                </span>
              </div>
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
            <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
              {data.categories.length} kategori · {data.subcategories.length} sub
            </span>
          </div>
          <div className="space-y-1">
            {data.categories.map((cat) => {
              const subs = subcategoriesByCategory[cat.id] ?? []
              const isExpanded = expandedCategory === cat.id
              return (
                <div key={cat.id} className="border border-pink-200/60 rounded-xl overflow-hidden">
                  {/* Category header (clickable) */}
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                    className="w-full flex items-center gap-2 bg-white/70 px-3 py-2 hover:bg-white/90 transition"
                  >
                    <span className="text-lg">{cat.icon ?? '📁'}</span>
                    <span className="text-xs font-bold text-pink-950 flex-1 text-left">
                      {cat.name}
                    </span>
                    <span className="text-[9px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                      {subs.length} sub
                    </span>
                    <span className={`text-xs text-pink-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </button>
                  {/* Subcategories (expandable) */}
                  {isExpanded && (
                    <div className="bg-pink-50/50 px-3 py-2 space-y-0.5 border-t border-pink-200/60">
                      {subs.length === 0 ? (
                        <p className="text-[10px] text-pink-700/50 italic py-1">
                          (Tidak ada subkategori — frontend handle via to_account_id)
                        </p>
                      ) : (
                        subs.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between py-1 px-2 hover:bg-white/50 rounded"
                          >
                            <span className="text-[11px] text-pink-900/80">
                              • {sub.name}
                            </span>
                            {sub.default_amount && sub.default_amount > 0 && (
                              <span className="text-[10px] text-pink-700/60 font-medium">
                                {formatRupiah(sub.default_amount)}
                              </span>
                            )}
                          </div>
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
      {!loading && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800">
          <b>📌 Mode Read-Only.</b>
          <br />
          Fitur edit (add/update/delete akun, kategori, subkategori) + set budget per subkategori
          akan diimplementasi di batch berikutnya. Saat ini lu bisa lihat semua data yang udah ter-apply.
        </div>
      )}
    </div>
  )
}
