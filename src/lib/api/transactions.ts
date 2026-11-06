/**
 * API: TRANSACTIONS — with optional targetUserId for shared access
 *
 * @path src/lib/api/transactions.ts
 */
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

/**
 * Create a new transaction.
 * If targetUserId is provided, transaction.user_id will be set to that user (shared access mode).
 * Otherwise, transaction.user_id stays as-is (own data).
 */
export async function createTransaction(
  data: TransactionInsert,
  targetUserId?: string
) {
  const supabase = createClient()
  const insertData = targetUserId ? { ...data, user_id: targetUserId } : data
  const { data: result, error } = await supabase
    .from('transactions')
    .insert(insertData)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return result as Transaction
}

export async function updateTransaction(id: string, data: TransactionUpdate) {
  const supabase = createClient()
  const { data: result, error } = await supabase
    .from('transactions')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return result as Transaction
}

export async function deleteTransaction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

export async function getTransaction(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data as Transaction
}
