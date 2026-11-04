'use client'

import { useState, useRef } from 'react'
import { getEReceipt, type ReceiptData } from '@/lib/api/receipt'
import { formatRupiah, getCurrentMonth, getCurrentYear, cn } from '@/lib/utils/format'

const BULAN_LIST = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
]

// Helper: detect mobile device for download method
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export default function ReceiptView() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())

  const [data, setData] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const receiptPaperRef = useRef<HTMLDivElement>(null)

  async function loadReceipt() {
    setLoading(true)
    setError(null)
    try {
      const result = await getEReceipt(month, year)
      if (result.status === 'success') {
        setData(result)
      } else {
        setError(result.message ?? 'Gagal memuat e-receipt')
      }
    } catch (err: any) {
      setError(err.message ?? 'Network error')
    } finally {
      setLoading(false)
    }
  }

  async function downloadReceiptAsImage() {
    if (!receiptPaperRef.current) return

    // Check if html2canvas is loaded
    if (typeof window === 'undefined' || !(window as any).html2canvas) {
      alert('Library html2canvas belum dimuat. Tambahkan script tag di layout.tsx')
      return
    }

    setDownloading(true)

    try {
      const fileName = `E-Receipt_${BULAN_LIST[month - 1]}_${year}.png`
      const receiptPaper = receiptPaperRef.current

      // Save original styles
      const originalMaxHeight = receiptPaper.style.maxHeight
      const originalOverflow = receiptPaper.style.overflowY

      // Expand for full capture
      receiptPaper.style.maxHeight = 'none'
      receiptPaper.style.overflowY = 'visible'

      const html2canvas = (window as any).html2canvas
      const canvas = await html2canvas(receiptPaper, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FEF9E7',
        logging: false,
      })

      // Restore styles
      receiptPaper.style.maxHeight = originalMaxHeight
      receiptPaper.style.overflowY = originalOverflow

      const imageURI = canvas.toDataURL('image/png')

      if (isMobileDevice()) {
        // Try Web Share API first
        if (navigator.share && navigator.canShare) {
          try {
            const blob = await (await fetch(imageURI)).blob()
            const file = new File([blob], fileName, { type: 'image/png' })
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: fileName,
                text: 'E-Receipt Keuangan Bulanan',
              })
              return
            }
          } catch (shareErr) {
            // Fall through to fallback
          }
        }
        // Fallback: open in new window
        const newWindow = window.open()
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>${fileName}</title></head>
              <body style="margin:0;background:#333;text-align:center;padding:20px;">
                <p style="color:#fff;font-family:sans-serif;font-size:14px;margin-bottom:15px;">
                  👉 Tekan lama (long-press) gambar di bawah ini, lalu pilih <b>"Simpan ke Foto"</b>
                </p>
                <img src="${imageURI}" style="max-width:100%;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.5);" />
              </body>
            </html>
          `)
        } else {
          alert('Pop-up diblokir browser. Coba buka di Chrome/Safari utama.')
        }
      } else {
        // Desktop: trigger download
        const link = document.createElement('a')
        link.download = fileName
        link.href = imageURI
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err: any) {
      console.error('Download failed:', err)
      alert('Gagal download: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  // Calculate net balance
  const netBalance = data
    ? data.summary.totalIncome - data.summary.totalOutcome - data.summary.totalSaving
    : 0

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="pb-2 border-b border-pink-200/50">
        <h1 className="text-base font-bold text-pink-950/80 tracking-wide">E-RECEIPT BULANAN</h1>
        <p className="text-[11px] text-pink-800/60 font-medium">Ringkasan & bukti kuitansi bulanan</p>
      </div>

      {/* Filter Bulan/Tahun */}
      <div className="glass-mini rounded-2xl p-2.5 border border-pink-200/60 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
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

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={loadReceipt}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 text-white font-semibold py-2 px-3 rounded-xl shadow-sm text-xs border border-pink-200/50 transition"
        >
          {loading ? '⏳ Memuat...' : '📊 Tampilkan Data'}
        </button>
        <button
          onClick={downloadReceiptAsImage}
          disabled={!data || downloading}
          className="flex-1 bg-white/80 hover:bg-white disabled:opacity-50 text-pink-950 font-semibold py-2 px-3 rounded-xl border border-pink-200/80 shadow-sm text-xs transition"
        >
          {downloading ? '⏳ Proses...' : '📥 Cetak / Simpan'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl py-2 px-3">
          ❌ {error}
        </div>
      )}

      {/* Receipt Paper */}
      {data ? (
        <div
          ref={receiptPaperRef}
          className="bg-amber-50/90 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/80 shadow-inner relative overflow-hidden font-mono text-pink-950"
          style={{ maxHeight: '600px', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3">
            <div className="text-xs font-black tracking-wide text-rose-500 uppercase mb-1">
              🖤 Monthly Cashflow Receipt 🖤
            </div>
            <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
              Official Financial Statement
            </div>
            <div className="mt-2 inline-block bg-rose-50 text-rose-600 px-3 py-0.5 rounded-full text-[11px] font-bold border border-rose-200">
              PERIODE: {BULAN_LIST[month - 1]} {year}
            </div>
          </div>

          {/* Saldo Bank & Total Aset */}
          <div className="bg-amber-100/40 p-2.5 rounded-lg border border-amber-200/60 mb-3 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">🏛️ SALDO BANK & CASH</span>
              <span className={cn(
                'font-mono font-bold',
                data.summary.saldoBank < 0 ? 'text-rose-600' : 'text-gray-800'
              )}>
                {formatRupiah(data.summary.saldoBank)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">📊 TOTAL ASET</span>
              <span className="font-mono font-bold text-emerald-600">
                {formatRupiah(data.summary.totalAset)}
              </span>
            </div>
          </div>

          {/* Ringkasan Utama */}
          <div className="space-y-1 text-xs border-b border-dashed border-gray-300 pb-3">
            <div className="flex justify-between items-center text-gray-600">
              <span>TOTAL PEMASUKAN</span>
              <span className="font-mono font-bold text-emerald-600">
                {formatRupiah(data.summary.totalIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>TOTAL PENGELUARAN</span>
              <span className="font-mono font-bold text-rose-600">
                {formatRupiah(data.summary.totalOutcome)}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>TABUNGAN / INVESTASI</span>
              <span className="font-mono font-bold text-blue-600">
                {formatRupiah(data.summary.totalSaving)}
              </span>
            </div>
          </div>

          {/* Sisa Cashflow (Net) */}
          <div className="my-3 p-2.5 bg-amber-100/70 border border-amber-300/80 rounded-lg text-center">
            <div className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">
              SISA CASHFLOW (NET)
            </div>
            <div className={cn(
              'text-base font-black font-mono mt-0.5',
              netBalance < 0 ? 'text-rose-600' : 'text-emerald-700'
            )}>
              {formatRupiah(netBalance)}
            </div>
          </div>

          {/* Detail Tabel */}
          <div className="mt-2 space-y-4">
            <ReceiptGroup label="INCOME" items={data.details.income} colorClass="text-emerald-600" />
            <ReceiptGroup label="INVESTMENT" items={data.details.investment} colorClass="text-blue-600" />
            <ReceiptGroup label="OUTCOME" items={data.details.outcome} colorClass="text-rose-600" />
          </div>

          {/* Footer */}
          <div className="mt-6 pt-3 border-t-2 border-dashed border-gray-300 text-center text-[10px] text-gray-400 space-y-1">
            <div>*** THANK YOU & KEEP SAVING ***</div>
            <div className="font-mono text-[9px]">
              Generated by Budgeting Master Sync · {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      ) : (
        !error && !loading && (
          <div className="bg-amber-50/85 p-5 rounded-2xl border border-amber-200 text-center py-12">
            <div className="text-4xl mb-3">🧾</div>
            <p className="text-xs font-bold text-pink-900/70">Struk belum dibuat</p>
            <p className="text-[10px] text-pink-900/50 mt-1">
              Pilih periode di atas, lalu klik <b>📊 Tampilkan Data</b>
            </p>
          </div>
        )
      )}
    </div>
  )
}

// ============================================================
// SUB-COMPONENT: ReceiptGroup (Income/Investment/Outcome)
// ============================================================
function ReceiptGroup({
  label,
  items,
  colorClass,
}: {
  label: string
  items: { kategori: string; subKategori: string; nominal: number }[]
  colorClass: string
}) {
  if (!items || items.length === 0) return null

  return (
    <div>
      <div className="mt-4 mb-2 border-b border-dashed border-gray-400/50 pb-1">
        <span className={cn('text-[11px] font-black tracking-wider uppercase', colorClass)}>
          {label}
        </span>
      </div>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex justify-between items-start text-xs py-1.5 border-b border-gray-100/60"
        >
          <div className="pr-2 flex-1 min-w-0">
            <div className="font-bold text-gray-800 truncate">{item.kategori}</div>
            <div className="text-[10px] text-gray-500 truncate">{item.subKategori}</div>
          </div>
          <div className="font-mono font-semibold text-gray-700 whitespace-nowrap">
            {formatRupiah(item.nominal)}
          </div>
        </div>
      ))}
    </div>
  )
}
