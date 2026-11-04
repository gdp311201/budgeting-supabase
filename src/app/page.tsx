import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BudgetingApp from '@/components/budgeting-app'
import SetupRequired from '@/components/setup-required'
import AdminPanelWrapper from '@/components/admin-panel-wrapper'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string }>
}) {
  const sp = await searchParams
  const isAdminRoute = sp.admin === '1'

  // Detect if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isConfigured =
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('YOUR-PROJECT-REF') &&
    !supabaseKey.includes('YOUR-ANON-KEY')

  // Not configured yet → show setup checklist
  if (!isConfigured) {
    return <SetupRequired />
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Admin route — needs to be logged in + email in ADMIN_EMAILS env var
  if (isAdminRoute) {
    if (!user) {
      redirect('/login?redirect=/?admin=1')
    }
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    if (!adminEmails.includes((user.email ?? '').toLowerCase())) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-rose-50 p-4">
          <div className="text-center">
            <div className="text-5xl mb-3">🚫</div>
            <h1 className="text-2xl font-bold text-rose-900">Akses Ditolak</h1>
            <p className="text-sm text-rose-700 mt-2">
              Halaman ini khusus admin. Email Anda ({user.email}) tidak terdaftar sebagai admin.
            </p>
            <a
              href="/"
              className="inline-block mt-4 text-rose-700 hover:text-rose-900 font-semibold underline text-sm"
            >
              ← Kembali ke Dashboard
            </a>
          </div>
        </main>
      )
    }
    return <AdminPanelWrapper />
  }

  // Not logged in → redirect to login
  if (!user) {
    redirect('/login')
  }

  // Get user's profile (theme + app name customization)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <BudgetingApp user={user} profile={profile} />
}
