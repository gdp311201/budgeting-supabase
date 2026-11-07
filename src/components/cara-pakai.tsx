'use client'

interface Props {
  onBack: () => void
}

const SECTIONS = [
  {
    icon: '🔐',
    title: 'PIN Keamanan',
    desc: 'Amankan app Anda dengan PIN 6 digit',
    items: [
      'Saat pertama login, Anda akan diminta setup PIN 6 digit',
      'Setiap kali buka app, masukkan PIN untuk unlock',
      'PIN disimpan di perangkat Anda (localStorage) — aman & terenkripsi',
      'Jika salah PIN 3x, otomatis sign out untuk keamanan',
      'Lupa PIN? Klik "Lupa PIN? Login ulang" di lock screen',
      'Login ulang pakai Google → setelah berhasil, set PIN baru',
      'Data Anda tetap aman saat reset PIN (tidak hilang)',
      'PIN berlaku per perangkat — HP dan laptop bisa beda PIN',
    ],
  },
  {
    icon: '👋',
    title: 'Welcome Page',
    desc: 'Halaman utama setelah PIN unlock',
    items: [
      'Setelah unlock PIN, Anda masuk ke Welcome Page',
      '3 menu tersedia: Dashboard, Cara Pakai, Fitur Premium',
      'Dashboard → langsung ke ringkasan keuangan Anda',
      'Cara Pakai → panduan lengkap (halaman ini)',
      'Fitur Premium → lihat benefit & upgrade ke Premium tier',
    ],
  },
  {
    icon: '📊',
    title: 'Dashboard',
    desc: 'Lihat ringkasan keuangan bulanan Anda',
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
    desc: 'Ringkasan kuitansi bulanan + download sebagai gambar (Premium)',
    items: [
      'Pilih bulan & tahun',
      'Klik "Tampilkan Data" untuk load receipt',
      'Lihat summary: Saldo Bank, Total Aset, Pemasukan, Pengeluaran, Tabungan',
      'Detail breakdown: Income, Investment, Outcome (sorted by nominal terbesar)',
      'Klik "📥 Cetak / Simpan" untuk download sebagai PNG (fitur Premium)',
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
    desc: 'Atur akun bank, kategori & budget bulanan Anda',
    items: [
      'Klik tombol ⚙️ di pojok kanan atas dashboard',
      'Pilih menu "💰 Setup Budget" dari Settings Hub',
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
    desc: 'Pilih tema warna & maskot favorit Anda',
    items: [
      'Klik tombol ⚙️ di pojok kanan atas dashboard',
      'Pilih menu "🎨 Theme Picker" dari Settings Hub',
      'Tab "Tema Warna": pilih dari tema Free / Premium / VIP',
      'Tab "Maskot": pilih maskot (emoji) yang Anda suka',
      'Warna app berubah INSTANTLY saat dipilih',
      'Maskot muncul di header, dashboard, dan loading screen',
      'Basic tier: 2 tema + 3 maskot',
      'Premium tier: 8 tema + 10 maskot tambahan',
      'VIP tier: eksklusif (khusus akun tertentu)',
    ],
  },
  {
    icon: '💑',
    title: 'Couple Budgeting (Premium)',
    desc: 'Share data budgeting dengan pasangan Anda',
    items: [
      'Fitur eksklusif Premium tier — Couple Budgeting',
      'Klik tombol ⚙️ di pojok kanan atas dashboard',
      'Pilih menu "👤 Account Switcher" dari Settings Hub',
      'Pilih akun pasangan Anda dari modal popup',
      'Saat switch ke akun pasangan: Anda bisa input, edit & hapus transaksi mereka',
      'Banner indikator "📊 Viewing shared data" muncul saat mode shared',
      'Switch balik ke "My Budget" kapan saja untuk kembali ke data Anda',
      'Sharing bersifat two-way: pasangan juga bisa akses data Anda',
      'Limit 1:1 couple — satu partner per user (Premium tier)',
    ],
  },
  {
    icon: '💎',
    title: 'Fitur Premium',
    desc: 'Upgrade ke Premium untuk unlock semua fitur',
    items: [
      'Klik menu "💎 Fitur Premium" di Welcome Page',
      'Lihat semua benefit Premium (8 fitur eksklusif)',
      'Lihat perbandingan Basic vs Premium tier',
      'Harga: Rp 88.000/tahun untuk Premium, Rp 50.000/tahun untuk Basic',
      'Promo: 3 hari FREE TRIAL otomatis saat pertama kali signup',
      'Klik "💬 Upgrade via WhatsApp" untuk pembayaran manual',
      'Setelah pembayaran terverifikasi, admin aktifkan Premium tier Anda',
      'Premium user juga bisa extend subscription via halaman yang sama',
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
      'Premium user: priority support (respon < 4 jam)',
    ],
  },
]

export default function CaraPakai({ onBack }: Props) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="wallpaper-bg" aria-hidden="true" />
      <div className="wallpaper-veil" aria-hidden="true" />

      {/* Header — z-30 supaya sticky di atas konten saat scroll */}
      <header
        className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-pink-200/50 px-4 py-3 flex items-center gap-3"
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
          <p className="text-[10px] text-pink-700/60">Panduan lengkap Growsphere Budgeting</p>
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
            💡 <b>Tips:</b> App ini bekerja terbaik jika Anda rutin mencatat setiap transaksi.
            <br />Anda bisa akses app dari Home Screen HP (Add to Home Screen) untuk pengalaman seperti native app.
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
