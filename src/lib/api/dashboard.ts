/**
 * API: DASHBOARD — with optional targetUserId for shared access
 *
 * @path src/lib/api/dashboard.ts
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

/**
 * Fetch dashboard data.
 * @param month - 1-12 (or 0 for all months)
 * @param year - e.g., 2026
 * @param targetUserId - Optional. If provided, fetch data for this user (shared access).
 *                       If null/undefined, fetch current user's own data.
 */
export async function getDashboard(
  month: number,
  year: number,
  targetUserId?: string
): Promise<DashboardData> {
  const supabase = createClient()
  const params: Record<string, any> = {
    p_month: month,
    p_year: year,
  }
  // Only pass p_target_user_id if explicitly provided
  if (targetUserId) {
    params.p_target_user_id = targetUserId
  }
  const { data, error } = await supabase.rpc('get_dashboard', params)
  if (error) throw new Error(error.message)
  return data as DashboardData
}
