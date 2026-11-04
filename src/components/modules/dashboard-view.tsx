'use client'

import { useEffect, useState, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { getDashboard, type DashboardData } from '@/lib/api/dashboard'
import { formatRupiah, getCurrentMonth, getCurrentYear } from '@/lib/utils/format'

interface Props {
  user: User
  onLongPressAsset: () => void
}

const BULAN_LIST = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
]

export default function DashboardView({ user, onLongPressAsset }: Props) {
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Long-press detection on asset card
  const pressTimer = useRef<NodeJS.Timeout | null>(null)
  const assetCardRef = useRef<HTMLDivElement>(null)

  function startPress() {
    pressTimer.current = setTimeout(() => {
      onLongPressAsset()
    }, 5000)
  }
  function cancelPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  async function loadDashboard() {
    setLoading(true)
    setError(null)
    try {
      const result = await getDashboard(month, year)
      if (result.status === 'success') {
        setData(result)
      } else {
        setError(result.message ?? 'Failed to load dashboard')
      }
    } catch (err: any) {
      setError(err.message ?? 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-pink-200/50">
        <div>
          <h1 className="text-base font-bold text-pink-950/80 tracking-wide">DASHBOARD</h1>
          <p className="text-[11px] text-pink-800/60 font-medium">
            Hi, {user.email?.split('@')[0] ?? 'there'} 👋
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-pink-100/80 text-pink-800 border border-pink-200 shadow-sm">
          ● Live
        </span>
      </div>

      {/* Filter Bulan/Tahun */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-pink-200/60 shadow-sm flex gap-2">
        <div className="w-1/2">
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Bulan</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-sm"
          >
            {BULAN_LIST.map((b, i) => (
              <option key={b} value={i + 1}>{b}</option>
            ))}
          </select>
        </div>
        <div className="w-1/2">
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Tahun</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-sm"
          >
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Load button */}
      <button
        onClick={loadDashboard}
        disabled={loading}
        className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 text-white font-semibold py-2.5 px-3 rounded-xl shadow-sm hover:shadow-md transition text-sm border border-pink-200/50"
      >
        {loading ? '⏳ Memuat Data...' : '📊 Tampilkan Dashboard'}
      </button>

      {/* Error */}
      {error && (
        <div className="text-center text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl py-2 px-3">
          ❌ {error}
        </div>
      )}

      {/* Asset Card (long-press to open Setup) */}
      {data && (
        <div
          ref={assetCardRef}
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          className="relative overflow-hidden bg-gradient-to-br from-pink-500/90 via-rose-500/90 to-pink-600/90 rounded-3xl p-5 text-white shadow-lg border border-white/30 cursor-pointer select-none"
        >
          <div className="relative z-10">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-pink-50 bg-white/15 border border-white/25 backdrop-blur-sm px-2.5 py-1 rounded-full">
              Total Aset Bersih
            </span>
            <div className="text-3xl font-black tracking-tight mt-2 drop-shadow">
              {formatRupiah(data.totalAset)}
            </div>
            <p className="text-[10px] text-pink-100/90 mt-1 font-medium">
              🌸 {data.quote}
            </p>
            <p className="text-[9px] text-pink-100/60 mt-2 italic">
              💡 Long-press kartu ini untuk Setup Budget
            </p>
          </div>
        </div>
      )}

      {/* Loading placeholder */}
      {!data && !error && (
        <div className="text-center py-12 bg-white/40 rounded-2xl border border-pink-200/60">
          <div className="text-4xl mb-2">🐘</div>
          <p className="text-xs font-semibold text-pink-900/70">
            Belum ada data dimuat
          </p>
          <p className="text-[10px] text-pink-900/50 mt-1">
            Pilih periode di atas, lalu klik <b>Tampilkan Dashboard</b>
          </p>
        </div>
      )}

      {/* Cashflow summary */}
      {data && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider">
            Cash Flow Bulan Ini
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-500/15 border border-emerald-300/60 p-2.5 rounded-xl">
              <span className="block text-[10px] font-bold text-emerald-900">💵 PEMASUKAN</span>
              <span className="text-xs font-bold text-emerald-950">
                {formatRupiah(data.cashflow.pemasukan)}
              </span>
            </div>
            <div className="bg-rose-500/15 border border-rose-300/60 p-2.5 rounded-xl">
              <span className="block text-[10px] font-bold text-rose-900">💸 TOTAL BIAYA</span>
              <span className="text-xs font-bold text-rose-950">
                {formatRupiah(data.cashflow.totalBiaya)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top 5 expenses */}
      {data && data.top5Expenses.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider mb-2">
            Top 5 Pengeluaran
          </h3>
          <div className="space-y-2 bg-white/60 p-3 rounded-2xl border border-pink-200/60">
            {data.top5Expenses.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border-b border-pink-200/40 pb-1.5 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-pink-200/80 text-pink-900 text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-pink-950">
                    {item.subKategori}
                  </span>
                </div>
                <span className="text-xs font-bold text-pink-950">
                  {formatRupiah(item.nominal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
