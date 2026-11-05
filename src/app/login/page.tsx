import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginButton from './login-button'

const GDP_LOGO = 'https://qxarqpbwbsxlbectwgba.supabase.co/storage/v1/object/public/logo/GDP_logo.png'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Already logged in → redirect home
  if (user) {
    redirect('/')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-4 relative overflow-hidden">
      {/* Decorative blur circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-pink-300/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-rose-300/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-sm text-center space-y-6">
        {/* GDP Logo */}
        <div className="w-[72px] h-[72px] mx-auto">
          <img
            src={GDP_LOGO}
            alt="GDP"
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(236, 72, 153, 0.2))' }}
          />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-pink-950 tracking-tight">
            Personal Budgeting
          </h1>
          <p className="text-xs text-pink-700/60 mt-2 leading-relaxed">
            Track. Save. Grow.<br />
            Your money, beautifully managed.
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white/60 backdrop-blur-md border border-white/70 rounded-2xl p-6 shadow-xl">
          <p className="text-xs font-semibold text-pink-900/70 mb-4">
            🔒 Sign in to access your budgeting dashboard
          </p>
          <LoginButton redirectTo={sp.redirect} />

          <p className="text-[10px] text-pink-700/50 mt-4 leading-relaxed">
            Your financial data is encrypted & only accessible by you.
          </p>
        </div>

        {/* Footer */}
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-pink-800/60">
            Growsphere Digital Product
          </p>
          <p className="text-[9px] text-pink-700/40 tracking-wide">
            Crafted with precision by Julyo Sechar
          </p>
        </div>
      </div>
    </main>
  )
}
