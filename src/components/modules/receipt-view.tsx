'use client'

/**
 * Receipt View — placeholder
 * TODO: integrate with getEReceipt() from src/lib/api/receipt.ts
 * Reuse logic from receipt.js original — html2canvas for download
 */
export default function ReceiptView() {
  return (
    <div className="space-y-3.5">
      <div className="pb-2 border-b border-pink-200/50">
        <h1 className="text-base font-bold text-pink-950/80 tracking-wide">E-RECEIPT BULANAN</h1>
        <p className="text-[11px] text-pink-800/60 font-medium">Ringkasan & bukti kuitansi bulanan</p>
      </div>

      <div className="bg-amber-50/85 p-5 rounded-2xl border border-amber-200 text-center py-12">
        <div className="text-4xl mb-3">🧾</div>
        <p className="text-xs font-bold text-pink-900/70">Struk belum dibuat</p>
        <p className="text-[10px] text-pink-900/50 mt-1">
          Pilih periode di atas, lalu klik <b>📊 Tampilkan Data</b>
        </p>
      </div>
    </div>
  )
}
