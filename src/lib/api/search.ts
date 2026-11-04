/**
 * API: SEARCH
 * Wraps the get_search() RPC function
 * Pass month=0 or year=0 for "all"
 */
import { createClient } from '@/lib/supabase/client'

export interface SearchTransaction {
  id: string
  tgl: string
  tgl_iso: string
  kategori: string
  subkategori: string
  display_label: string  // ← NEW: "→ MANDIRI" for PINDAH DANA, subkategori for others
  akun: string
  to_account_name: string | null  // ← NEW
  nominal: number
  type: string
}

export interface SearchData {
  status: 'success' | 'error'
  totalCount: number
  totalNominal: number
  transactions: SearchTransaction[]
  message?: string
}

export async function searchTransactions(params: {
  month?: number  // 0 or undefined = all months
  year?: number   // 0 or undefined = all years
  keyword?: string
  sort?: 'DESC' | 'ASC'
}): Promise<SearchData> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_search', {
    p_month: params.month ?? 0,
    p_year: params.year ?? 0,
    p_keyword: params.keyword ?? '',
    p_sort: params.sort ?? 'DESC',
  })
  if (error) throw new Error(error.message)
  return data as SearchData
}
