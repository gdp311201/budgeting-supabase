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

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isAdminRoute) {
    redirect('/admin')
  }

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Sprint 8: CRITICAL — Check if user is suspended or deleted
  // This catches users who have a cached session but were blocked by admin
  if (profile?.tier === 'suspended') {
    await supabase.auth.signOut()
    redirect('/login?error=suspended')
  }

  if (profile?.tier === 'deleted') {
    await supabase.auth.signOut()
    redirect('/login?error=deleted')
  }

  return <BudgetingApp user={user} initialProfile={profile} />
}
