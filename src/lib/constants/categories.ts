/**
 * Default categories & subcategories
 * Mirror dari SUB_DATA di transaksi.js original
 * Dipakai scripts/seed-default-data.ts buat first-time setup user baru
 */

export interface DefaultCategory {
  name: string
  type: 'income' | 'expense' | 'transfer' | 'investment' | 'debt' | 'other'
  icon: string
  subcategories: string[]
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: '💸 PINDAH DANA',
    type: 'transfer',
    icon: '💸',
    subcategories: ['SEABANK', 'BCA', 'MANDIRI', 'DANA', 'CASH'],
  },
  {
    name: '💵 PEMASUKAN',
    type: 'income',
    icon: '💵',
    subcategories: [
      'Gaji / Salary',
      'Bonus & Komisi',
      'Dividen Saham',
      'Pendapatan Lain-Lain',
      'Penjualan Aset / Properti',
      'Hibah / Hadiah Uang',
      'THR / Tunjangan Tahunan',
    ],
  },
  {
    name: '🍚 KEBUTUHAN POKOK',
    type: 'expense',
    icon: '🍚',
    subcategories: [
      'Makanan',
      'Minuman',
      'Snack / Cemilan',
      'Kebutuhan Rumah Tangga',
      'Kebutuhan Dapur',
    ],
  },
  {
    name: '🏠 TEMPAT TINGGAL',
    type: 'expense',
    icon: '🏠',
    subcategories: ['Sewa / KPR Rumah', 'Maintenance Rumah', 'Listrik', 'Air', 'Internet'],
  },
  {
    name: '🚌 TRANSPORTASI',
    type: 'expense',
    icon: '🚌',
    subcategories: ['BBM', 'Ojek Online', 'Transportasi Umum', 'Maintenance Kendaraan'],
  },
  {
    name: '🩺 KESEHATAN',
    type: 'expense',
    icon: '🩺',
    subcategories: ['Vitamin & Obat', 'Asuransi / BPJS', 'Periksa ke Dokter'],
  },
  {
    name: '💇 PERAWATAN DIRI',
    type: 'expense',
    icon: '💇',
    subcategories: ['Skincare', 'Barbershop / Salon', 'Bodycare', 'Gym', 'IPL', 'Pilates', 'Treatment'],
  },
  {
    name: '📚 PENGEMBANGAN DIRI',
    type: 'expense',
    icon: '📚',
    subcategories: ['Pendidikan / Pelatihan', 'Buku', 'Kursus', 'Aplikasi Belajar', 'Webinar'],
  },
  {
    name: '💰 TABUNGAN/ INVESTASI',
    type: 'investment',
    icon: '💰',
    subcategories: ['Safety Money', 'Deposito Bank', 'Reksadana', 'Arisan', 'Logam Mulia', 'Saham'],
  },
  {
    name: '🎉 GAYA HIDUP/ HIBURAN',
    type: 'expense',
    icon: '🎉',
    subcategories: [
      'Makan di Luar',
      'Coffee Shop',
      'Subs (Nx, Spotify, dll.)',
      'Liburan / Traveling',
      'Hobi & Rekreasi',
      'Cash Out',
    ],
  },
  {
    name: '💳 HUTANG / CICILAN',
    type: 'debt',
    icon: '💳',
    subcategories: ['Pinjaman Modal Usaha', 'Cicilan Kredit / Pinjaman', 'Sumbangan & Donasi Rutin', 'KPR'],
  },
  {
    name: '⚠️ LAIN-LAIN',
    type: 'other',
    icon: '⚠️',
    subcategories: ['Admin Bank', 'Pengeluaran Tak Terduga', 'Bantu Keluarga', 'Barang Rusak', 'Parkir'],
  },
]

export const DEFAULT_ACCOUNTS = [
  { name: 'SEABANK', type: 'bank' as const, opening_balance: 0, sort_order: 1 },
  { name: 'BCA', type: 'bank' as const, opening_balance: 0, sort_order: 2 },
  { name: 'MANDIRI', type: 'bank' as const, opening_balance: 0, sort_order: 3 },
  { name: 'DANA', type: 'ewallet' as const, opening_balance: 0, sort_order: 4 },
  { name: 'CASH', type: 'cash' as const, opening_balance: 0, sort_order: 5 },
]

export const DEFAULT_INVESTMENT_ACCOUNTS = [
  { name: 'Safety Money', type: 'investment' as const, opening_balance: 0, sort_order: 10 },
  { name: 'Deposito Bank', type: 'investment' as const, opening_balance: 0, sort_order: 11 },
  { name: 'Reksadana', type: 'investment' as const, opening_balance: 0, sort_order: 12 },
  { name: 'Arisan', type: 'investment' as const, opening_balance: 0, sort_order: 13 },
  { name: 'Logam Mulia', type: 'investment' as const, opening_balance: 0, sort_order: 14 },
  { name: 'Saham', type: 'investment' as const, opening_balance: 0, sort_order: 15 },
]
