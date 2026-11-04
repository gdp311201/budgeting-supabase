'use client'

import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { getSetupData, type SetupData } from '@/lib/api/setup'
import { formatRupiah } from '@/lib/utils/format'

interface Props {
  user: User
  onClose: () => void
}

/**
 * Setup View — placeholder for Setup Budget panel
 * TODO: build full Setup UI like original setup.js
 * Includes: Akun Bank, Kategori, Sub-kategori, Budget per subkategori
 */
export default function SetupView({ user, onClose }: Props) {
  const [data, setData] = useState<SetupData | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-pink-950/40 backdrop-blur-[5px]">
      <div className="bg-white/95 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide drop-shadow">
              ⚙️ SETUP BUDGET
            </h3>
            <p className="text-[11px] text-white/90 font-semibold mt-0.5">
              Akun, kategori & budget bulanan
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
        <div className="overflow-y-auto px-4 py-3 space-y-4 flex-1">
          {loading && (
            <p className="text-center text-xs text-pink-800/60 py-8">Memuat data setup...</p>
          )}

          {/* Accounts */}
          {data && (
            <section>
              <h4 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider mb-2">
                🏦 Akun Bank — Saldo Awal
              </h4>
              <div className="space-y-1">
                {data.accounts.filter((a) => a.type !== 'investment').map((acc) => (
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
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mt-1">
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

          {/* Categories */}
          {data && (
            <section>
              <h4 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider mb-2">
                📋 Kategori ({data.categories.length})
              </h4>
              <div className="space-y-1">
                {data.categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-2 bg-white/60 border border-pink-200/60 rounded-xl px-3 py-2"
                  >
                    <span className="text-lg">{cat.icon ?? '📁'}</span>
                    <span className="text-xs font-semibold text-pink-950 flex-1 truncate">
                      {cat.name}
                    </span>
                    <span className="text-[9px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                      {cat.type}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TODO: Investment accounts, Budget per subkategori, edit mode */}
          {!loading && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800">
              <b>📌 Modul ini adalah starter template.</b>
              <br />
              Full edit mode + budget per subkategori + investment accounts perlu diimplementasi.
              Lihat <code>src/lib/api/setup.ts</code> untuk helper functions yang sudah disediain.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-pink-200/60 bg-white/60 backdrop-blur-md">
          <button
            onClick={onClose}
            className="w-full bg-white/90 text-pink-950 font-semibold py-2.5 px-4 rounded-xl border border-pink-200/80 shadow-sm transition text-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
