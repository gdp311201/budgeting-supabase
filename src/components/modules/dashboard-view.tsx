'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getDashboard, type DashboardData } from '@/lib/api/dashboard'
import { formatRupiah, getCurrentMonth, getCurrentYear, getTahunListDynamic, cn } from '@/lib/utils/format'

interface Props {
  user: User
  mascotEmoji?: string
  nickname?: string | null
}

const BULAN_LIST = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
]

export default function DashboardView({ user, mascotEmoji, nickname }: Props) {
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tahunList = getTahunListDynamic()

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
            Hi, {nickname ?? user.email?.split('@')[0] ?? 'there'} 👋
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
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-sm">
            {BULAN_LIST.map((b, i) => (<option key={b} value={i + 1}>{b}</option>))}
          </select>
        </div>
        <div className="w-1/2">
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Tahun</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-sm">
            {tahunList.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
      </div>

      {/* Load button */}
      <button onClick={loadDashboard} disabled={loading}
        className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 text-white font-semibold py-2.5 px-3 rounded-xl shadow-sm hover:shadow-md transition text-sm border border-pink-200/50">
        {loading ? '⏳ Memuat Data...' : '📊 Tampilkan Dashboard'}
      </button>

      {error && (
        <div className="text-center text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl py-2 px-3">❌ {error}</div>
      )}

      {/* Asset Card */}
      {data && (
        <div className="relative overflow-hidden bg-gradient-to-br from-pink-500/90 via-rose-500/90 to-pink-600/90 rounded-3xl p-5 text-white shadow-lg border border-white/30">
          <div className="relative z-10">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-pink-50 bg-white/15 border border-white/25 backdrop-blur-sm px-2.5 py-1 rounded-full">Total Aset Bersih</span>
            <div className="text-3xl font-black tracking-tight mt-2 drop-shadow">{formatRupiah(data.totalAset)}</div>
            <p className="text-[10px] text-pink-100/90 mt-1 font-medium">🌸 {data.quote}</p>
          </div>
        </div>
      )}

      {/* Loading placeholder */}
      {!data && !error && (
        <div className="text-center py-12 bg-white/40 rounded-2xl border border-pink-200/60">
          <div className="text-4xl mb-2">{mascotEmoji ?? '🐘'}</div>
          <p className="text-xs font-semibold text-pink-900/70">Belum ada data dimuat</p>
          <p className="text-[10px] text-pink-900/50 mt-1">Pilih periode di atas, lalu klik <b>Tampilkan Dashboard</b></p>
        </div>
      )}

      {/* KAS & BANK */}
      {data && data.bank.items.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-emerald-950/80 uppercase tracking-wider">Kas & Bank</h3>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200/80">{formatRupiah(data.bank.total)}</span>
          </div>
          <div className={cn(
            'grid gap-2 mb-2',
            data.bank.items.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'
          )}>
            {data.bank.items.map((item, idx) => (
              <div key={idx} className="bg-white/50 border border-pink-100/80 p-2 rounded-xl text-center">
                <span className="block text-[9px] font-bold text-pink-900/70 truncate">{item.name}</span>
                <span className="text-xs font-bold text-pink-950">{formatRupiah(item.saldo)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASET INVESTASI */}
      {data && data.investment.items.filter(a => a.saldo > 0).length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-indigo-950/80 uppercase tracking-wider">Aset Investasi</h3>
            <span className="text-xs font-extrabold text-indigo-800 bg-indigo-100/70 px-2 py-0.5 rounded-md border border-indigo-200/80">{formatRupiah(data.investment.total)}</span>
          </div>
          <div className={cn(
            'grid gap-2 mb-2',
            data.investment.items.filter(a => a.saldo > 0).length <= 2 ? 'grid-cols-2' : 'grid-cols-3'
          )}>
            {data.investment.items.filter(a => a.saldo > 0).map((item, idx) => (
              <div key={idx} className="bg-white/50 border border-indigo-100/80 p-2 rounded-xl text-center">
                <span className="block text-[8px] font-bold text-indigo-900/70 truncate">{item.name}</span>
                <span className="text-[11px] font-bold text-indigo-950">{formatRupiah(item.saldo)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CASH FLOW BULAN INI */}
      {data && (
        <div>
          <h3 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider mb-2">Cash Flow Bulan Ini</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-500/15 border border-emerald-300/60 p-2.5 rounded-xl">
              <span className="block text-[10px] font-bold text-emerald-900">💵 PEMASUKAN</span>
              <span className="text-xs font-bold text-emerald-950">{formatRupiah(data.cashflow.pemasukan)}</span>
            </div>
            <div className="bg-blue-500/15 border border-blue-300/60 p-2.5 rounded-xl">
              <span className="block text-[10px] font-bold text-blue-900">💰 INVESTASI BULANAN</span>
              <span className="text-xs font-bold text-blue-950">{formatRupiah(data.cashflow.investasiBulan)}</span>
            </div>
            <div className="bg-purple-500/15 border border-purple-300/60 p-2.5 rounded-xl">
              <span className="block text-[10px] font-bold text-purple-900">💳 HUTANG/CICILAN</span>
              <span className="text-xs font-bold text-purple-950">{formatRupiah(data.cashflow.hutang)}</span>
            </div>
            <div className="bg-rose-500/15 border border-rose-300/60 p-2.5 rounded-xl">
              <span className="block text-[10px] font-bold text-rose-900">💸 TOTAL BIAYA</span>
              <span className="text-xs font-bold text-rose-950">{formatRupiah(data.cashflow.totalBiaya)}</span>
            </div>
          </div>
        </div>
      )}

      {/* RINCIAN KATEGORI BIAYA */}
      {data && data.biayaDetail.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider mb-2">Rincian Kategori Biaya</h3>
          <div className="grid grid-cols-2 gap-2">
            {data.biayaDetail.map((item, idx) => {
              const pct = data.cashflow.totalBiaya > 0 ? (item.nominal / data.cashflow.totalBiaya) * 100 : 0
              return (
                <div key={idx} className="bg-white/50 border border-pink-100/80 p-2 rounded-xl">
                  <span className="block text-[9px] font-bold text-pink-900/70">{item.nama}</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-xs font-bold text-pink-950">{formatRupiah(item.nominal)}</span>
                    <span className="text-[9px] font-bold text-pink-700">{pct > 0 ? `${Math.round(pct)}%` : ''}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top 5 expenses */}
      {data && data.top5Expenses.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider mb-2">Top 5 Pengeluaran</h3>
          <div className="space-y-2 bg-white/60 p-3 rounded-2xl border border-pink-200/60">
            {data.top5Expenses.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-pink-200/40 pb-1.5 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-pink-200/80 text-pink-900 text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>
                  <span className="text-xs font-semibold text-pink-950">{item.subKategori}</span>
                </div>
                <span className="text-xs font-bold text-pink-950">{formatRupiah(item.nominal)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
