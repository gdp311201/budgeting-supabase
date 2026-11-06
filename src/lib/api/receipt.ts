/**
 * API: RECEIPT (E-Receipt) — with optional targetUserId for shared access
 *
 * @path src/lib/api/receipt.ts
 */
import { createClient } from '@/lib/supabase/client'

export interface ReceiptData {
  status: 'success' | 'error'
  bulan: number
  tahun: number
  summary: {
    saldoBank: number
    totalAset: number
    totalIncome: number
    totalOutcome: number
    totalSaving: number
  }
  details: {
    income: { kategori: string; kategori_icon: string | null; subKategori: string; nominal: number }[]
    investment: { kategori: string; kategori_icon: string | null; subKategori: string; nominal: number }[]
    outcome: { kategori: string; kategori_icon: string | null; subKategori: string; nominal: number }[]
  }
  message?: string
}

/**
 * Fetch e-receipt data.
 * @param month - 1-12
 * @param year - e.g., 2026
 * @param targetUserId - Optional. If provided, fetch for this user (shared access).
 */
export async function getEReceipt(
  month: number,
  year: number,
  targetUserId?: string
): Promise<ReceiptData> {
  const supabase = createClient()
  const params: Record<string, any> = {
    p_month: month,
    p_year: year,
  }
  if (targetUserId) {
    params.p_target_user_id = targetUserId
  }
  const { data, error } = await supabase.rpc('get_ereceipt', params)
  if (error) throw new Error(error.message)
  return data as ReceiptData
}
