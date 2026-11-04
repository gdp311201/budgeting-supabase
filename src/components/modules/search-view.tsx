'use client'

/**
 * Search View — placeholder
 * TODO: integrate with searchTransactions() from src/lib/api/search.ts
 * Include swipe-to-edit/delete (Gmail style) like original search.js
 */
export default function SearchView() {
  return (
    <div className="space-y-3.5">
      <div className="pb-2 border-b border-pink-200/50">
        <h1 className="text-base font-bold text-pink-950/80 tracking-wide">PENCARIAN BIAYA</h1>
        <p className="text-[11px] text-pink-800/60 font-medium">Cari, edit & hapus transaksi</p>
      </div>

      <div className="bg-white/60 rounded-2xl p-3 border border-pink-200/60 shadow-sm space-y-2">
        <input
          type="text"
          placeholder="Cari transaksi, ketik 'seabank', 'makan', dll..."
          className="w-full bg-white/80 border border-pink-200 rounded-xl pl-3 pr-3 py-2 text-xs font-medium"
        />
      </div>

      <button
        className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-semibold py-2.5 px-3 rounded-xl shadow-sm hover:shadow-md transition text-sm border border-pink-200/50"
      >
        🔍 Cari Sekarang
      </button>

      <div className="bg-white/60 p-3 rounded-2xl border border-pink-200/60 text-center">
        <p className="text-xs text-pink-800/60 py-8">
          🔍 Hasil pencarian akan muncul di sini
        </p>
      </div>
    </div>
  )
}
