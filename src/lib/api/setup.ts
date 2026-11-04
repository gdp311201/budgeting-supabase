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

/**
 * Set DEFAULT budget (sticky, applies to all months unless overridden)
 * month = 0, year = 0 means "default"
 */
export async function setDefaultBudget(
  userId: string,
  subcategoryId: string,
  amount: number
): Promise<Budget> {
  return upsertBudget({
    user_id: userId,
    subcategory_id: subcategoryId,
    month: 0,
    year: 0,
    amount,
  })
}

/**
 * Get default budget (sticky) for a subcategory
 */
export function getDefaultBudget(
  budgets: Budget[],
  subcategoryId: string
): number {
  const defaultBudget = budgets.find(
    (b) => b.subcategory_id === subcategoryId && b.month === 0 && b.year === 0
  )
  return defaultBudget?.amount ?? 0
}

/**
 * Get effective budget for a subcategory in a specific month/year
 * Priority: monthly override > default
 */
export function getEffectiveBudget(
  budgets: Budget[],
  subcategoryId: string,
  month: number,
  year: number
): { amount: number; isOverride: boolean } {
  const override = budgets.find(
    (b) => b.subcategory_id === subcategoryId && b.month === month && b.year === year
  )
  if (override) {
    return { amount: override.amount, isOverride: true }
  }
  const defaultBudget = budgets.find(
    (b) => b.subcategory_id === subcategoryId && b.month === 0 && b.year === 0
  )
  return { amount: defaultBudget?.amount ?? 0, isOverride: false }
}

// ============================================================
// ACCOUNT SELECTION — toggle is_selected
// ============================================================

export async function setAccountSelected(
  accountId: string,
  isSelected: boolean
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('accounts')
    .update({ is_selected: isSelected })
    .eq('id', accountId)
  if (error) throw new Error(error.message)
}
