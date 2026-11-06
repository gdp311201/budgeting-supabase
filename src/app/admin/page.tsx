import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanelWrapper from '@/components/admin-panel-wrapper'
import SetupRequired from '@/components/setup-required'

export const metadata = {
  title: 'GDP Admin — Budgeting Master Sync',
  description: 'Admin control panel for GDP Budgeting',
  manifest: '/admin/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GDP Admin',
  },
  icons: {
    icon: 'https://qxarqpbwbsxlbectwgba.supabase.co/storage/v1/object/public/logo/GDP_logo.png',
    apple: 'https://qxarqpbwbsxlbectwgba.supabase.co/storage/v1/object/public/logo/GDP_logo.png',
  },
}

export const viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default async function AdminPage() {
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

  if (!user) {
    redirect('/login?redirect=/admin')
  }

  // Check 1: ADMIN_EMAILS env var (legacy)
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const isAdminByEmail = adminEmails.includes((user.email ?? '').toLowerCase())

  // Check 2: profiles.is_admin flag (new, more reliable)
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, tier, full_name')
    .eq('id', user.id)
    .single()
  const isAdminByFlag = profile?.is_admin === true || profile?.tier === 'admin'

  // Allow if EITHER check passes
  if (!isAdminByEmail && !isAdminByFlag) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-3">🚫</div>
          <h1 className="text-2xl font-bold text-rose-300">Access Denied</h1>
          <p className="text-sm text-slate-400 mt-2">
            Halaman ini khusus admin. Email Anda ({user.email}) tidak terdaftar sebagai admin.
          </p>
          <a
            href="/"
            className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 font-semibold underline text-sm"
          >
            ← Kembali ke Dashboard
          </a>
        </div>
      </main>
    )
  }

  // ✅ User is admin — render admin panel
  return <AdminPanelWrapper adminEmail={user.email ?? ''} adminName={profile?.full_name ?? 'Admin'} />
}
