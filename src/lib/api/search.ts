/**
 * API: SEARCH — with optional targetUserId for shared access
 *
 * @path src/lib/api/search.ts
 */
import { createClient } from '@/lib/supabase/client'

export interface SearchTransaction {
  id: string
  tgl: string
  tgl_iso: string
  kategori: string
  subkategori: string
  display_label: string
  akun: string
  to_account_name: string | null
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

/**
 * Search transactions by keyword.
 * @param params.month - 0 or undefined = all months
 * @param params.year - 0 or undefined = all years
 * @param params.keyword - search keyword
 * @param params.sort - 'DESC' (default) or 'ASC'
 * @param params.targetUserId - Optional. If provided, search in this user's data.
 */
export async function searchTransactions(params: {
  month?: number
  year?: number
  keyword?: string
  sort?: 'DESC' | 'ASC'
  targetUserId?: string
}): Promise<SearchData> {
  const supabase = createClient()
  const rpcParams: Record<string, any> = {
    p_month: params.month ?? 0,
    p_year: params.year ?? 0,
    p_keyword: params.keyword ?? '',
    p_sort: params.sort ?? 'DESC',
  }
  if (params.targetUserId) {
    rpcParams.p_target_user_id = params.targetUserId
  }
  const { data, error } = await supabase.rpc('get_search', rpcParams)
  if (error) throw new Error(error.message)
  return data as SearchData
}
