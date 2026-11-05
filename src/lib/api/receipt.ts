/**
 * API: RECEIPT (E-Receipt)
 * Wraps the get_ereceipt() RPC function
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

export async function getEReceipt(month: number, year: number): Promise<ReceiptData> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_ereceipt', {
    p_month: month,
    p_year: year,
  })
  if (error) throw new Error(error.message)
  return data as ReceiptData
}
