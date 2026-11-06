import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BudgetingApp from '@/components/budgeting-app'
import SetupRequired from '@/components/setup-required'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string }>
}) {
  const sp = await searchParams
  const isAdminRoute = sp.admin === '1'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isConfigured =
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('YOUR-PROJECT-REF') &&
    !supabaseKey.includes('YOUR-ANON-KEY')

  if (!isConfigured) {
    return <SetupRequired />
  }

  // ============================================================
  // ADMIN ROUTE — redirect old URL (?admin=1) to new /admin route
  // (Sprint 2A: Admin panel sekarang di route terpisah /admin)
  // ============================================================
  if (isAdminRoute) {
    redirect('/admin')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ============================================================
  // REGULAR ROUTE — render BudgetingApp
  // ============================================================
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <BudgetingApp user={user} initialProfile={profile} />
}
