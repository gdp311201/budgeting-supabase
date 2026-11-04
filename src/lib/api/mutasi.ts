/**
 * API: MUTASI
 * Wraps the get_mutasi_bank() RPC function
 */
import { createClient } from '@/lib/supabase/client'

export interface MutasiTransaction {
  id: string
  tgl_iso: string
  tgl: string
  kategori: string
  subkategori: string
  display_label: string  // ← NEW: "→ MANDIRI" for PINDAH DANA, subkategori for others
  amount: number
  type: string
  to_account_name: string | null  // ← NEW
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

export async function getMutasiBank(
  accountId: string,
  month: number,
  year: number
): Promise<MutasiData> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_mutasi_bank', {
    p_account_id: accountId,
    p_month: month,
    p_year: year,
  })
  if (error) throw new Error(error.message)
  return data as MutasiData
}
