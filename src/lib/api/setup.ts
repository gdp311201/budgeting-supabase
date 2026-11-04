/**
 * API: SETUP — get setup data + CRUD operations
 */
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type AccountInsert = Database['public']['Tables']['accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['accounts']['Update']

type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

type Subcategory = Database['public']['Tables']['subcategories']['Row']
type SubcategoryInsert = Database['public']['Tables']['subcategories']['Insert']
type SubcategoryUpdate = Database['public']['Tables']['subcategories']['Update']

type Budget = Database['public']['Tables']['budgets']['Row']
type BudgetInsert = Database['public']['Tables']['budgets']['Insert']

export interface SetupData {
  status: 'success' | 'error'
  accounts: Account[]
  categories: Category[]
  subcategories: Subcategory[]
  budgets: Budget[]
  message?: string
}

export async function getSetupData(): Promise<SetupData> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_setup_data')
  if (error) throw new Error(error.message)
  return data as SetupData
}

// ============================================================
// ACCOUNTS — CRUD
// ============================================================

export async function addAccount(account: AccountInsert): Promise<Account> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('accounts')
    .insert(account)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Account
}

export async function updateAccount(id: string, updates: AccountUpdate): Promise<Account> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Account
}

export async function deleteAccount(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('accounts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ============================================================
// CATEGORIES — CRUD
// ============================================================

export async function addCategory(category: CategoryInsert): Promise<Category> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Category
}

export async function updateCategory(id: string, updates: CategoryUpdate): Promise<Category> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Category
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ============================================================
// SUBCATEGORIES — CRUD
// ============================================================

export async function addSubcategory(sub: SubcategoryInsert): Promise<Subcategory> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('subcategories')
    .insert(sub)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Subcategory
}

export async function updateSubcategory(id: string, updates: SubcategoryUpdate): Promise<Subcategory> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('subcategories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Subcategory
}

export async function deleteSubcategory(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('subcategories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ============================================================
// BUDGETS — upsert (set budget per subkategori per bulan/tahun)
// ============================================================

export async function upsertBudget(
  budget: BudgetInsert
): Promise<Budget> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budgets')
    .upsert(budget, { onConflict: 'user_id,subcategory_id,month,year' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Budget
}
