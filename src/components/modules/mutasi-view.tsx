'use client'

import { useState } from 'react'

const BULAN_LIST = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
]
const AKUN = ['SEABANK', 'BCA', 'MANDIRI', 'DANA', 'CASH']

/**
 * Mutasi View — placeholder
 * TODO: integrate with getMutasiBank() from src/lib/api/mutasi.ts
 * Pattern sama kayak DashboardView — load when user clicks button.
 */
export default function MutasiView() {
  const [akun, setAkun] = useState('SEABANK')
  const [bulan, setBulan] = useState('AGUSTUS')
  const [tahun, setTahun] = useState(2026)

  return (
    <div className="space-y-3.5">
      <div className="pb-2 border-b border-pink-200/50">
        <h1 className="text-base font-bold text-pink-950/80 tracking-wide">MUTASI BANK CHECKER</h1>
        <p className="text-[11px] text-pink-800/60 font-medium">Cek rekonsiliasi & transaksi bank</p>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-pink-200/60 shadow-sm grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-0.5">Akun</label>
          <select
            value={akun}
            onChange={(e) => setAkun(e.target.value)}
            className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-sm"
          >
            {AKUN.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-0.5">Bulan</label>
          <select
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-sm"
          >
            {BULAN_LIST.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-0.5">Tahun</label>
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-sm"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-semibold py-2.5 px-3 rounded-xl shadow-sm hover:shadow-md transition text-sm border border-pink-200/50"
      >
        🏦 Tampilkan Mutasi
      </button>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-amber-500/10 border border-amber-300/60 p-3 rounded-2xl">
          <span className="text-[10px] font-bold text-amber-800 uppercase block">Saldo Awal</span>
          <span className="text-sm font-extrabold text-amber-950 block mt-0.5">—</span>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-300/60 p-3 rounded-2xl">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Saldo Akhir</span>
          <span className="text-sm font-extrabold text-emerald-950 block mt-0.5">—</span>
        </div>
      </div>

      <div className="bg-white/60 p-3 rounded-2xl border border-pink-200/60 text-center">
        <p className="text-xs text-pink-800/60 py-8">
          📋 Modul Mutasi Bank siap di-integrate dengan <code className="bg-pink-100 px-1 rounded">getMutasiBank()</code>
        </p>
      </div>
    </div>
  )
}
