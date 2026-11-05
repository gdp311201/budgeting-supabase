'use client'

interface Props {
  onBack: () => void
}

const SECTIONS = [
  {
    icon: '📊',
    title: 'Dashboard',
    desc: 'Lihat ringkasan keuangan bulanan kamu',
    items: [
      'Pilih bulan & tahun di filter atas',
      'Klik "Tampilkan Dashboard" untuk load data',
      'Lihat Total Aset Bersih, Kas & Bank, Aset Investasi',
      'Cek Cash Flow: Pemasukan, Investasi Bulanan, Hutang, Total Biaya',
      'Rincian Kategori Biaya menampilkan breakdown per kategori + persentase',
      'Top 5 Pengeluaran menunjukkan sub-kategori dengan pengeluaran terbesar',
    ],
  },
  {
    icon: '✏️',
    title: 'Input Transaksi',
    desc: 'Catat pemasukan, pengeluaran, pindah dana & investasi',
    items: [
      'Pilih tanggal transaksi',
      'Pilih kategori (12 kategori tersedia)',
      'Pilih sub-kategori (otomatis filter sesuai kategori)',
      'Masukkan nominal (otomatis format Rp dengan pemisah titik)',
      'Pilih akun bank/e-wallet/cash',
      'Untuk PINDAH DANA: pilih akun asal + akun tujuan',
      'Klik "Simpan Transaksi" untuk menyimpan',
    ],
  },
  {
    icon: '🏦',
    title: 'Mutasi Bank',
    desc: 'Cek rekonsiliasi & transaksi per akun',
    items: [
      'Pilih akun (bank/e-wallet/cash/investasi)',
      'Pilih bulan (atau "SEMUA" untuk lihat 1 tahun penuh)',
      'Pilih tahun',
      'Klik "Tampilkan Mutasi"',
      'Lihat Saldo Awal, Saldo Akhir, dan Summary',
      'Riwayat mutasi menampilkan setiap transaksi dengan warna:',
      '  🟢 Hijau (+) = Income / Mutasi Masuk',
      '  🔴 Merah (-) = Expense / Mutasi Keluar',
      '  🔵 Biru (+) = Transfer Masuk',
      '  🟣 Ungu (-) = Transfer Keluar',
    ],
  },
  {
    icon: '🧾',
    title: 'E-Receipt',
    desc: 'Ringkasan kuitansi bulanan + download sebagai gambar',
    items: [
      'Pilih bulan & tahun',
      'Klik "Tampilkan Data" untuk load receipt',
      'Lihat summary: Saldo Bank, Total Aset, Pemasukan, Pengeluaran, Tabungan',
      'Detail breakdown: Income, Investment, Outcome (sorted by nominal terbesar)',
      'Klik "Cetak / Simpan" untuk download sebagai PNG',
      'Di HP: gambar bisa di-share via Web Share API atau long-press untuk save',
    ],
  },
  {
    icon: '🔍',
    title: 'Pencarian',
    desc: 'Cari, edit & hapus transaksi dengan swipe gesture',
    items: [
      'Masukkan kata kunci (mis. "makan", "seabank", "50000")',
      'Pilih filter bulan & tahun (atau "SEMUA")',
      'Pilih urutan: Terbaru (DESC) atau Terlama (ASC)',
      'Klik "Cari Sekarang" atau tekan Enter',
      'GESER KARTU KE KANAN → tombol biru "✏️ EDIT" muncul',
      'GESER KARTU KE KIRI → tombol merah "🗑️ HAPUS" muncul',
      'Klik EDIT untuk ubah transaksi (modal form muncul)',
      'Klik HAPUS untuk hapus permanen (konfirmasi muncul)',
    ],
  },
  {
    icon: '⚙️',
    title: 'Setup Budget',
    desc: 'Atur akun bank, kategori & budget bulanan',
    items: [
      'Klik tombol ⚙️ (gear) di pojok kanan atas',
      'Rekap Alokasi: lihat total budget per kategori + sisa budget',
      'Akun Bank: tambah/hapus bank (pilih dari 22 bank options)',
      'Kategori: tambah kategori custom, expand untuk lihat sub-kategori',
      'Set Budget: klik tombol 💰 per sub-kategori untuk set budget default',
      'Budget default = sticky (berlaku semua bulan, bisa di-override)',
      'Klik "✏️ Edit Data" untuk masuk edit mode',
      'Klik "✓ Selesai Edit" untuk keluar edit mode',
    ],
  },
  {
    icon: '🎨',
    title: 'Personalisasi',
    desc: 'Pilih tema warna & maskot favoritmu',
    items: [
      'Klik tombol 🎨 di header',
      'Tab "Tema Warna": pilih dari tema Free / Premium / VIP',
      'Tab "Maskot": pilih maskot (emoji) yang kamu suka',
      'Warna app berubah INSTANTLY saat dipilih',
      'Maskot muncul di header, dashboard, dan loading screen',
      'Free tier: 3 tema + 3 maskot',
      'Premium tier: 6 tema + 6 maskot tambahan',
      'VIP tier: eksklusif (khusus akun tertentu)',
    ],
  },
  {
    icon: '💬',
    title: 'Bantuan & Support',
    desc: 'Hubungi developer jika ada pertanyaan',
    items: [
      'Klik tombol hijau 💬 (WhatsApp) di pojok kanan bawah',
      'Chat langsung ke developer via WhatsApp',
      'Tanya tentang: cara pakai, error, request fitur, dll',
      'Developer akan respon secepatnya (max 24 jam)',
    ],
  },
]

export default function CaraPakai({ onBack }: Props) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="wallpaper-bg" aria-hidden="true" />
      <div className="wallpaper-veil" aria-hidden="true" />

      {/* Header */}
      <header
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-pink-200/50 px-4 py-3 flex items-center gap-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 font-bold flex items-center justify-center hover:bg-pink-200 transition shrink-0"
        >
          ←
        </button>
        <div>
          <h1 className="text-base font-bold text-pink-950">📖 Cara Pakai</h1>
          <p className="text-[10px] text-pink-700/60">Panduan lengkap Budgeting Master Sync</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 pb-32 relative z-10 space-y-4">
        {SECTIONS.map((section, idx) => (
          <div key={idx} className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-pink-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{section.icon}</span>
              <div>
                <h3 className="text-sm font-bold text-pink-950">{section.title}</h3>
                <p className="text-[10px] text-pink-700/60">{section.desc}</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {section.items.map((item, i) => (
                <li key={i} className="text-[11px] text-pink-900/70 leading-relaxed flex gap-1.5">
                  <span className="text-pink-400 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Footer note */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-amber-800 leading-relaxed">
            💡 <b>Tips:</b> App ini bekerja terbaik jika kamu rutin mencatat setiap transaksi.
            <br />Lu bisa akses app dari Home Screen HP (Add to Home Screen) untuk pengalaman seperti native app.
          </p>
        </div>

        {/* Back button */}
        <button
          onClick={onBack}
          className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition text-sm"
        >
          ← Kembali ke Menu Utama
        </button>
      </main>
    </div>
  )
}
