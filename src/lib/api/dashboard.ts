/**
 * API: DASHBOARD
 * Wraps the get_dashboard() RPC function in Supabase
 */
import { createClient } from '@/lib/supabase/client'

export interface DashboardData {
  status: 'success' | 'error'
  bulan: number
  tahun: number
  totalAset: number
  bank: {
    total: number
    items: { name: string; saldo: number }[]
  }
  investment: {
    total: number
    items: { name: string; saldo: number }[]
  }
  cashflow: {
    pemasukan: number
    hutang: number
    investasiBulan: number
    totalBiaya: number
  }
  biayaDetail: { nama: string; nominal: number }[]
  top5Expenses: { subKategori: string; nominal: number }[]
  quote: string
  message?: string
}

export async function getDashboard(month: number, year: number): Promise<DashboardData> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_dashboard', {
    p_month: month,
    p_year: year,
  })
  if (error) throw new Error(error.message)
  return data as DashboardData
}
