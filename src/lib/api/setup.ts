/**
 * API: SETUP — with optional targetUserId for shared access
 *
 * @path src/lib/api/setup.ts
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

/**
 * Fetch setup data (accounts, categories, subcategories, budgets).
 * @param targetUserId - Optional. If provided, fetch for this user (shared access).
 */
export async function getSetupData(targetUserId?: string): Promise<SetupData> {
  const supabase = createClient()
  const params: Record<string, any> = {}
  if (targetUserId) {
    params.p_target_user_id = targetUserId
  }
  const { data, error } = await supabase.rpc('get_setup_data', params)
  if (error) throw new Error(error.message)
  return data as SetupData
}

// ============================================================
// ACCOUNTS — CRUD (targetUserId-aware)
// ============================================================

/**
 * Add a new account.
 * If targetUserId is provided, account will be inserted for that user (shared access).
 */
export async function addAccount(
  account: AccountInsert,
  targetUserId?: string
): Promise<Account> {
  const supabase = createClient()
  const insertData = targetUserId ? { ...account, user_id: targetUserId } : account
  const { data, error } = await supabase
    .from('accounts')
    .insert(insertData)
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

export async function addCategory(
  category: CategoryInsert,
  targetUserId?: string
): Promise<Category> {
  const supabase = createClient()
  const insertData = targetUserId ? { ...category, user_id: targetUserId } : category
  const { data, error } = await supabase
    .from('categories')
    .insert(insertData)
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

/**
 * Add subcategory. If parent category is 'investment', auto-create
 * a matching investment account (linked by name).
 */
export async function addSubcategory(
  sub: SubcategoryInsert,
  targetUserId?: string
): Promise<Subcategory> {
  const supabase = createClient()
  const insertData = targetUserId ? { ...sub, user_id: targetUserId } : sub
  const { data, error } = await supabase
    .from('subcategories')
    .insert(insertData)
    .select()
    .single()
  if (error) throw new Error(error.message)

  const newSub = data as Subcategory

  // Check if parent category is 'investment'
  const { data: cat } = await supabase
    .from('categories')
    .select('type')
    .eq('id', insertData.category_id)
    .single()

  if (cat?.type === 'investment') {
    // Auto-create investment account with same name
    try {
      await supabase.from('accounts').insert({
        user_id: insertData.user_id,
        name: newSub.name,
        type: 'investment',
        opening_balance: 0,
        sort_order: 200,
        is_active: true,
        is_selected: true,
        is_protected: false,
      })
    } catch (err) {
      console.warn('Failed to auto-create investment account:', err)
    }
  }

  return newSub
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

/**
 * Delete subcategory. If linked to an investment account (custom),
 * also delete the account (if no transactions reference it).
 */
export async function deleteSubcategory(id: string): Promise<void> {
  const supabase = createClient()

  const { data: sub } = await supabase
    .from('subcategories')
    .select('user_id, name, category_id, is_custom')
    .eq('id', id)
    .single()

  if (!sub) throw new Error('Subcategory not found')

  const { data: cat } = await supabase
    .from('categories')
    .select('type')
    .eq('id', sub.category_id)
    .single()

  const { error } = await supabase.from('subcategories').delete().eq('id', id)
  if (error) throw new Error(error.message)

  if (cat?.type === 'investment' && sub.is_custom) {
    const { data: acc } = await supabase
      .from('accounts')
      .select('id, is_protected')
      .eq('user_id', sub.user_id)
      .eq('name', sub.name)
      .eq('type', 'investment')
      .single()

    if (acc && !acc.is_protected) {
      await supabase.from('accounts').delete().eq('id', acc.id)
    }
  }
}

// ============================================================
// BUDGETS — upsert (targetUserId-aware)
// ============================================================

export async function upsertBudget(
  budget: BudgetInsert,
  targetUserId?: string
): Promise<Budget> {
  const supabase = createClient()
  const insertData = targetUserId ? { ...budget, user_id: targetUserId } : budget
  const { data, error } = await supabase
    .from('budgets')
    .upsert(insertData, { onConflict: 'user_id,subcategory_id,month,year' })
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

export function getDefaultBudget(
  budgets: Budget[],
  subcategoryId: string
): number {
  const defaultBudget = budgets.find(
    (b) => b.subcategory_id === subcategoryId && b.month === 0 && b.year === 0
  )
  return defaultBudget?.amount ?? 0
}

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

/**
 * Update opening balance of an investment account by name (auto-link)
 */
export async function updateInvestmentAccountByName(
  userId: string,
  accountName: string,
  newBalance: number
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('accounts')
    .update({ opening_balance: newBalance })
    .eq('user_id', userId)
    .eq('name', accountName)
    .eq('type', 'investment')
  if (error) throw new Error(error.message)
}

/**
 * Delete an investment account by name (auto-link, custom only)
 */
export async function deleteInvestmentAccountByName(
  userId: string,
  accountName: string
): Promise<void> {
  const supabase = createClient()
  const { data: acc } = await supabase
    .from('accounts')
    .select('id, is_protected')
    .eq('user_id', userId)
    .eq('name', accountName)
    .eq('type', 'investment')
    .single()

  if (acc && !acc.is_protected) {
    await supabase.from('accounts').delete().eq('id', acc.id)
  }
}
