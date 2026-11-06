/**
 * API: SETUP MASTER — with optional targetUserId for shared access
 *
 * Updated to accept targetUserId so account switching also changes
 * the categories/accounts/subcategories shown in dropdowns.
 *
 * @path src/lib/api/setup-master.ts
 */
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Category = Database['public']['Tables']['categories']['Row']
type Subcategory = Database['public']['Tables']['subcategories']['Row']
type Account = Database['public']['Tables']['accounts']['Row']

export interface SetupMaster {
  categories: Category[]
  subcategories: Subcategory[]
  accounts: Account[]
}

/**
 * Fetch all setup data for a user (categories, subcategories, active accounts).
 *
 * @param targetUserId - Optional. If provided, fetch for this user (shared access).
 *                       If null/undefined, fetch for current logged-in user.
 *
 * Note: When targetUserId is provided, the RLS policy must allow the caller
 * to access that user's data (via shared_access table).
 */
export async function getSetupMaster(targetUserId?: string): Promise<SetupMaster> {
  const supabase = createClient()

  // Determine which user_id to fetch data for
  let userIdToFetch: string

  if (targetUserId) {
    // Shared access mode — use target user's ID directly
    // RLS policy will verify caller has shared_access permission
    userIdToFetch = targetUserId
  } else {
    // Own data mode — fetch current logged-in user
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Not authenticated')
    userIdToFetch = userData.user.id
  }

  const [catRes, subRes, accRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', userIdToFetch)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('subcategories')
      .select('*')
      .eq('user_id', userIdToFetch)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userIdToFetch)
      .eq('is_active', true)
      .eq('is_selected', true)
      .order('name', { ascending: true }),
  ])

  if (catRes.error) throw new Error(catRes.error.message)
  if (subRes.error) throw new Error(subRes.error.message)
  if (accRes.error) throw new Error(accRes.error.message)

  return {
    categories: catRes.data ?? [],
    subcategories: subRes.data ?? [],
    accounts: accRes.data ?? [],
  }
}

/**
 * Get subcategories filtered by category_id
 */
export function filterSubcategoriesByCategory(
  subcategories: Subcategory[],
  categoryId: string | null
): Subcategory[] {
  if (!categoryId) return []
  return subcategories.filter((s) => s.category_id === categoryId)
}

/**
 * Group accounts by type (cash → bank → ewallet → investment)
 * Returns sorted alphabetically within each group
 */
export function groupAccountsByType(accounts: Account[]): {
  cash: Account[]
  bank: Account[]
  ewallet: Account[]
  investment: Account[]
} {
  return {
    cash: accounts.filter((a) => a.type === 'cash').sort((a, b) => a.name.localeCompare(b.name)),
    bank: accounts.filter((a) => a.type === 'bank').sort((a, b) => a.name.localeCompare(b.name)),
    ewallet: accounts.filter((a) => a.type === 'ewallet').sort((a, b) => a.name.localeCompare(b.name)),
    investment: accounts.filter((a) => a.type === 'investment').sort((a, b) => a.name.localeCompare(b.name)),
  }
}

/**
 * Resolve category_id by name (case-insensitive)
 */
export function resolveCategoryIdByName(
  categories: Category[],
  name: string
): string | null {
  const cat = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
  return cat?.id ?? null
}

/**
 * Determine transaction type based on category type
 */
export function determineTransactionType(
  categoryType: Category['type'] | undefined
): Database['public']['Tables']['transactions']['Row']['type'] {
  switch (categoryType) {
    case 'income':
      return 'income'
    case 'transfer':
      return 'transfer_out'
    case 'investment':
      return 'investment'
    case 'expense':
    case 'debt':
    case 'other':
    default:
      return 'expense'
  }
}
