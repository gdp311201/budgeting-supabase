import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginButton from './login-button'

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
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Icon */}
        <div className="text-7xl mb-2 animate-pulse">🐘</div>

        {/* Title */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-700/70">
            Welcome Back
          </p>
          <h1 className="text-3xl font-bold text-pink-950 tracking-tight">
            Budgeting Master Sync
          </h1>
          <p className="text-sm text-pink-800/70 mt-2">
            Your personal finance companion — beautiful, smart, and yours.
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white/60 backdrop-blur-md border border-white/70 rounded-2xl p-6 shadow-xl">
          <p className="text-xs font-semibold text-pink-900/70 mb-4">
            🔒 Sign in to access your budgeting dashboard
          </p>
          <LoginButton redirectTo={sp.redirect} />

          <p className="text-[10px] text-pink-700/50 mt-4 leading-relaxed">
            By signing in, you agree that your financial data is stored securely
            and only accessible by you.
          </p>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-pink-800/50">
          Made with ❤️ for personalized budgeting experience
        </p>
      </div>
    </main>
  )
}
