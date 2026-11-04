/**
 * API: BANK OPTIONS — fetch list of available banks/e-wallets
 * Used by Setup Edit Mode to populate "Add Account" dropdown
 */
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type BankOption = Database['public']['Tables']['bank_options']['Row']

export async function getBankOptions(): Promise<BankOption[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bank_options')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
