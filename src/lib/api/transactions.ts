/**
 * API: TRANSACTIONS
 * Abstraction layer for transaction CRUD operations.
 * If you ever migrate from Supabase to another backend,
 * you only change this file — frontend stays the same.
 */
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export async function createTransaction(data: TransactionInsert) {
  const supabase = createClient()
  const { data: result, error } = await supabase
    .from('transactions')
    .insert(data)
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
