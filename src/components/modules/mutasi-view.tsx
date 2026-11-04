'use client'

import { useEffect, useState } from 'react'
import { getMutasiBank, type MutasiData } from '@/lib/api/mutasi'
import {
  getSetupMaster,
  groupAccountsByType,
  type SetupMaster,
} from '@/lib/api/setup-master'
import { formatRupiah, cn, getCurrentMonth, getCurrentYear } from '@/lib/utils/format'

const BULAN_LIST = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
]

export default function MutasiView() {
  const [master, setMaster] = useState<SetupMaster | null>(null)
  const [loading, setLoading] = useState(true)

  const [accountId, setAccountId] = useState('')
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())

  const [data, setData] = useState<MutasiData | null>(null)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSetupMaster()
      .then((result) => {
        setMaster(result)
        // Auto-select first account
        if (result.accounts.length > 0) {
          setAccountId(result.accounts[0].id)
        }
      })
      .catch((err) => {
        console.error('Failed to load setup:', err)
        setError('Gagal memuat data akun: ' + err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  async function loadMutasi() {
    if (!accountId) {
      setError('Pilih akun dulu')
      return
    }
    setFetching(true)
    setError(null)
    try {
      const result = await getMutasiBank(accountId, month, year)
      if (result.status === 'success') {
        setData(result)
      } else {
        setError(result.message ?? 'Gagal memuat data mutasi')
      }
    } catch (err: any) {
      setError(err.message ?? 'Network error')
    } finally {
      setFetching(false)
    }
  }

  const groupedAccounts = master ? groupAccountsByType(master.accounts) : null

  if (loading) {
    return (
      <div className="space-y-3.5">
        <div className="pb-2 border-b border-pink-200/50">
          <h1 className="text-base font-bold text-pink-950/80 tracking-wide">MUTASI BANK CHECKER</h1>
          <p className="text-[11px] text-pink-800/60 font-medium">Cek rekonsiliasi & transaksi bank</p>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mb-2"></div>
          <p className="text-xs text-pink-800/60 font-medium">Memuat data akun...</p>
        </div>
      </div>
    )
  }

  if (!master || master.accounts.length === 0) {
    return (
      <div className="space-y-3.5">
        <div className="pb-2 border-b border-pink-200/50">
          <h1 className="text-base font-bold text-pink-950/80 tracking-wide">MUTASI BANK CHECKER</h1>
          <p className="text-[11px] text-pink-800/60 font-medium">Cek rekonsiliasi & transaksi bank</p>
        </div>
        <div className="text-center py-12 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-xs font-bold text-amber-900">Belum ada akun aktif</p>
          <p className="text-[10px] text-amber-800/70 mt-1">
            Buka tab <b>Setting</b> dulu untuk pilih akun yang dipakai.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="pb-2 border-b border-pink-200/50">
        <h1 className="text-base font-bold text-pink-950/80 tracking-wide">MUTASI BANK CHECKER</h1>
        <p className="text-[11px] text-pink-800/60 font-medium">Cek rekonsiliasi & transaksi bank</p>
      </div>

      {/* Filter */}
      <div className="glass-mini rounded-2xl p-2.5 border border-pink-200/60 shadow-sm">
        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-0.5">Akun</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-xs"
            >
              {groupedAccounts && (
                <>
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
                  {groupedAccounts.investment.length > 0 && (
                    <optgroup label="💰 INVESTASI">
                      {groupedAccounts.investment.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </optgroup>
                  )}
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-0.5">Bulan</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-xs"
            >
              {BULAN_LIST.map((b, i) => (
                <option key={b} value={i + 1}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-0.5">Tahun</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-white/80 border border-pink-200 rounded-xl py-1.5 px-2 font-semibold text-xs"
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Load Button */}
      <button
        onClick={loadMutasi}
        disabled={fetching || !accountId}
        className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 text-white font-semibold py-2.5 px-3 rounded-xl shadow-sm hover:shadow-md transition text-sm border border-pink-200/50"
      >
        {fetching ? '⏳ Memuat...' : '🏦 Tampilkan Mutasi'}
      </button>

      {/* Error */}
      {error && (
        <div className="text-center text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl py-2 px-3">
          ❌ {error}
        </div>
      )}

      {/* Saldo Awal & Saldo Akhir */}
      {data && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-300/60 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Saldo Awal</span>
            <span className={cn(
              'text-sm font-extrabold block mt-0.5',
              data.saldoAwal >= 0 ? 'text-amber-950' : 'text-rose-700'
            )}>
              {formatRupiah(data.saldoAwal)}
            </span>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-300/60 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Saldo Akhir</span>
            <span className={cn(
              'text-sm font-extrabold block mt-0.5',
              data.saldoAkhir >= 0 ? 'text-emerald-950' : 'text-rose-700'
            )}>
              {formatRupiah(data.saldoAkhir)}
            </span>
          </div>
        </div>
      )}

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-4 gap-1 text-center glass-mini p-2 rounded-xl border border-pink-200/50">
          <div>
            <span className="text-[9px] text-pink-900/60 block font-semibold">INCOME</span>
            <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
              {formatRupiah(data.summary.totalIncome)}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-pink-900/60 block font-semibold">EXPENSE</span>
            <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
              {formatRupiah(data.summary.totalExpense)}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-pink-900/60 block font-semibold">MUTASI IN</span>
            <span className="text-[10px] font-bold text-blue-600 block mt-0.5">
              {formatRupiah(data.summary.totalMutasiIn)}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-pink-900/60 block font-semibold">MUTASI OUT</span>
            <span className="text-[10px] font-bold text-purple-600 block mt-0.5">
              {formatRupiah(data.summary.totalMutasiOut)}
            </span>
          </div>
        </div>
      )}

      {/* Riwayat Mutasi */}
      {data && (
        <div className="glass-mini rounded-2xl p-3 border border-pink-200/60 shadow-sm">
          <h4 className="text-xs font-bold text-pink-950/80 uppercase tracking-wider mb-2.5">
            Riwayat Mutasi ({data.transactions.length})
          </h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {data.transactions.length === 0 ? (
              <p className="text-center text-xs text-pink-800/60 py-6 font-medium">
                Tidak ada mutasi transaksi pada periode ini.
              </p>
            ) : (
              data.transactions.map((tx, idx) => (
                <div
                  key={tx.id ?? idx}
                  className="p-2.5 bg-white/60 rounded-xl border border-pink-100/80 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-pink-900/60 font-semibold">{tx.tgl}</span>
                    <span className="text-[9px] bg-pink-100/80 text-pink-800 px-2 py-0.5 rounded-full font-medium">
                      {tx.kategori}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-pink-950 truncate max-w-[65%]">
                      {tx.subkategori}
                    </p>
                    <div className="text-right">
                      {tx.income != null && tx.income > 0 && (
                        <span className="text-xs text-emerald-600 font-bold">
                          +{formatRupiah(tx.income)}
                        </span>
                      )}
                      {tx.expense != null && tx.expense > 0 && (
                        <span className="text-xs text-rose-600 font-bold">
                          -{formatRupiah(tx.expense)}
                        </span>
                      )}
                      {tx.mutasi_in != null && tx.mutasi_in > 0 && (
                        <span className="text-xs text-blue-600 font-bold">
                          +{formatRupiah(tx.mutasi_in)}
                        </span>
                      )}
                      {tx.mutasi_out != null && tx.mutasi_out > 0 && (
                        <span className="text-xs text-purple-600 font-bold">
                          -{formatRupiah(tx.mutasi_out)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data && !error && !fetching && (
        <div className="glass-mini rounded-2xl p-3 border border-pink-200/60 text-center">
          <p className="text-xs text-pink-800/60 py-8">
            Belum ada data dimuat.<br/>
            Atur filter di atas, lalu klik <b>🏦 Tampilkan Mutasi</b>.
          </p>
        </div>
      )}
    </div>
  )
}
