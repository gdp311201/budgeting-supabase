/**
 * API: MUTASI — with optional targetUserId for shared access
 *
 * @path src/lib/api/mutasi.ts
 */
import { createClient } from '@/lib/supabase/client'

export interface MutasiTransaction {
  id: string
  tgl_iso: string
  tgl: string
  kategori: string
  subkategori: string
  display_label: string
  amount: number
  type: string
  to_account_name: string | null
  income: number | null
  expense: number | null
  mutasi_in: number | null
  mutasi_out: number | null
}

export interface MutasiData {
  status: 'success' | 'error'
  saldoAwal: number
  saldoAkhir: number
  summary: {
    totalIncome: number
    totalExpense: number
    totalMutasiIn: number
    totalMutasiOut: number
  }
  transactions: MutasiTransaction[]
  message?: string
}

/**
 * Fetch bank mutation (mutasi) for a specific account.
 * @param accountId - UUID of account
 * @param month - 1-12 (0 for all months in year)
 * @param year - e.g., 2026
 * @param targetUserId - Optional. If provided, fetch for this user (shared access).
 */
export async function getMutasiBank(
  accountId: string,
  month: number,
  year: number,
  targetUserId?: string
): Promise<MutasiData> {
  const supabase = createClient()
  const params: Record<string, any> = {
    p_account_id: accountId,
    p_month: month,
    p_year: year,
  }
  if (targetUserId) {
    params.p_target_user_id = targetUserId
  }
  const { data, error } = await supabase.rpc('get_mutasi_bank', params)
  if (error) throw new Error(error.message)
  return data as MutasiData
}
