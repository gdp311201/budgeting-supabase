/**
 * Format utilities — Rupiah, dates, escape HTML
 * Ported from original transaksi.js / dashboard.js helpers
 */

export function formatRupiah(num: number | null | undefined | string): string {
  if (num === null || num === undefined || num === '') return 'Rp 0'
  const n = typeof num === 'string' ? Number(num) : num
  if (isNaN(n)) return 'Rp 0'
  const formatted = Math.abs(n).toLocaleString('id-ID')
  return n < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`
}

export function formatRupiahInput(el: HTMLInputElement) {
  let value = el.value.replace(/[^0-9]/g, '')
  if (value === '') {
    el.value = ''
    return
  }
  const formatted = new Intl.NumberFormat('id-ID').format(value)
  el.value = `Rp ${formatted}`
}

export function parseRupiah(value: string): number {
  const digits = value.replace(/[^0-9]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

const BULAN_ID = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
]

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function getBulanList() {
  return BULAN_ID
}

export function getTahunList(from = 2024, to?: number) {
  const endYear = to ?? new Date().getFullYear() + 2
  const years: number[] = []
  for (let y = endYear; y >= from; y--) years.push(y)
  return years
}

/**
 * Dynamic year list: from signupYear to currentYear + 1
 * Returns descending (newest first)
 */
export function getTahunListDynamic(signupYear: number = 2024): number[] {
  const currentYear = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  ).getFullYear()
  const endYear = currentYear + 1
  const startYear = Math.min(signupYear, 2024)
  const years: number[] = []
  for (let y = endYear; y >= startYear; y--) years.push(y)
  return years
}

export function nowWIB(): string {
  try {
    return (
      new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour12: false,
      }) + ' WIB'
    )
  } catch {
    return new Date().toLocaleTimeString('en-GB', { hour12: false })
  }
}

export function formatDateID(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  const day = d.getDate()
  const month = BULAN_SINGKAT[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

export function formatDateTimeID(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  return `${formatDateID(d)} ${nowWIB()}`
}

export function getCurrentMonth(): number {
  // WIB aware
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  )
  return now.getMonth() + 1
}

export function getCurrentYear(): number {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  )
  return now.getFullYear()
}

export function escapeHtml(str: string | null | undefined): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
