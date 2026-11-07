/**
 * API: INSIGHTS — Monthly insights + Budget progress
 *
 * @path src/lib/api/insights.ts
 */
import { createClient } from '@/lib/supabase/client'

// ============================================================
// Types
// ============================================================

export interface BudgetProgressItem {
  subcategory_id: string
  subcategory_name: string
  category_name: string
  category_icon: string | null
  budget_amount: number
  actual_spending: number
  remaining: number
  percentage: number
  status: 'no_budget' | 'unused' | 'good' | 'warning' | 'critical' | 'exceeded'
}

export interface BudgetProgressData {
  status: 'success' | 'error'
  month: number
  year: number
  items: BudgetProgressItem[]
  message?: string
}

export interface MonthlyInsightsData {
  status: 'success' | 'error'
  month: number
  year: number
  current: {
    income: number
    expense: number
    investment: number
    savings: number
  }
  previous: {
    income: number
    expense: number
    investment: number
    savings: number
  }
  changes: {
    income_pct: number
    expense_pct: number
    savings_pct: number
  }
  top_categories: {
    category: string
    icon: string | null
    amount: number
    percentage: number
  }[]
  budget_remaining: {
    subcategory: string
    category: string
    budget: number
    spent: number
    remaining: number
    percentage: number
  }[]
  insights: string[]
  message?: string
}

// ============================================================
// API Functions
// ============================================================

/**
 * Get budget progress for a specific month/year.
 * Shows budget vs actual spending per subkategori.
 */
export async function getBudgetProgress(
  month: number,
  year: number,
  targetUserId?: string
): Promise<BudgetProgressData> {
  const supabase = createClient()
  const params: Record<string, any> = {
    p_month: month,
    p_year: year,
  }
  if (targetUserId) {
    params.p_target_user_id = targetUserId
  }
  const { data, error } = await supabase.rpc('get_budget_progress', params)
  if (error) throw new Error(error.message)
  return data as BudgetProgressData
}

/**
 * Get monthly insights — compare current vs previous month.
 * Includes AI-style rule-based insights.
 */
export async function getMonthlyInsights(
  month: number,
  year: number,
  targetUserId?: string
): Promise<MonthlyInsightsData> {
  const supabase = createClient()
  const params: Record<string, any> = {
    p_month: month,
    p_year: year,
  }
  if (targetUserId) {
    params.p_target_user_id = targetUserId
  }
  const { data, error } = await supabase.rpc('get_monthly_insights', params)
  if (error) throw new Error(error.message)
  return data as MonthlyInsightsData
}
