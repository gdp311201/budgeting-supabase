/**
 * API: SETUP
 * Wraps the get_setup_data() RPC function + save operations
 */
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

export interface SetupData {
  status: 'success' | 'error'
  accounts: Database['public']['Tables']['accounts']['Row'][]
  categories: Database['public']['Tables']['categories']['Row'][]
  subcategories: Database['public']['Tables']['subcategories']['Row'][]
  budgets: Database['public']['Tables']['budgets']['Row'][]
  message?: string
}

export async function getSetupData(): Promise<SetupData> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_setup_data')
  if (error) throw new Error(error.message)
  return data as SetupData
}

// ============================================================
// Save operations for setup panel
// ============================================================

export async function upsertAccount(
  account: Database['public']['Tables']['accounts']['Insert']
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('accounts')
    .upsert(account, { onConflict: 'user_id,name' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertCategory(
  category: Database['public']['Tables']['categories']['Insert']
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .upsert(category, { onConflict: 'user_id,name' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertSubcategory(
  sub: Database['public']['Tables']['subcategories']['Insert']
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('subcategories')
    .upsert(sub, { onConflict: 'user_id,category_id,name' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertBudget(
  budget: Database['public']['Tables']['budgets']['Insert']
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budgets')
    .upsert(budget, { onConflict: 'user_id,subcategory_id,month,year' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
