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
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-4 overflow-y-auto">
      <div className="w-full max-w-sm text-center space-y-6 py-8">
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

        {/* ===== Pricing Preview (Sprint 4B) ===== */}
        <details className="bg-white/50 backdrop-blur-md border border-pink-200/60 rounded-2xl overflow-hidden shadow-lg">
          <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-pink-50/50 transition">
            <span className="text-sm font-bold text-pink-950">
              💎 Lihat Paket & Harga
            </span>
            <span className="text-pink-400 text-xs">▼</span>
          </summary>

          <div className="px-4 pb-4 space-y-3">
            {/* Trial promo banner */}
            <div className="bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl p-3 text-center">
              <p className="text-xs font-bold">🎁 3 Hari FREE TRIAL Premium!</p>
              <p className="text-[10px] text-white/80 mt-0.5">
                Otomatis aktif saat signup pertama kali
              </p>
            </div>

            {/* Pricing table */}
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b-2 border-pink-200">
                  <th className="text-left py-2 px-2 font-bold text-pink-950">Fitur</th>
                  <th className="text-center py-2 px-1 font-bold text-slate-600 bg-slate-50/50 rounded-t-lg">
                    👤 Basic<br/>
                    <span className="text-[11px] font-black">Rp 50K</span>
                    <span className="text-[8px] text-slate-500">/tahun</span>
                  </th>
                  <th className="text-center py-2 px-1 font-bold text-pink-700 bg-pink-50 rounded-t-lg">
                    💎 Premium<br/>
                    <span className="text-[11px] font-black">Rp 88K</span>
                    <span className="text-[8px] text-pink-500">/tahun</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-2 text-pink-900 font-medium">5 Modul Budgeting</td>
                  <td className="text-center text-emerald-600 bg-slate-50/30">✓</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-2 text-pink-900 font-medium">PIN Security Lock</td>
                  <td className="text-center text-emerald-600 bg-slate-50/30">✓</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-2 text-pink-900 font-medium">Panduan Cara Pakai</td>
                  <td className="text-center text-emerald-600 bg-slate-50/30">✓</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-2 text-pink-900 font-medium">WhatsApp Support</td>
                  <td className="text-center text-emerald-600 bg-slate-50/30">✓</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-2 text-pink-900 font-medium">Tema Warna</td>
                  <td className="text-center text-slate-500 bg-slate-50/30">2 tema</td>
                  <td className="text-center text-pink-700 font-bold bg-pink-50/50">8 tema</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-2 text-pink-900 font-medium">Maskot</td>
                  <td className="text-center text-slate-500 bg-slate-50/30">3 maskot</td>
                  <td className="text-center text-pink-700 font-bold bg-pink-50/50">10 maskot</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-2 text-pink-900 font-medium">Custom Categories</td>
                  <td className="text-center text-slate-500 bg-slate-50/30">Max 5</td>
                  <td className="text-center text-pink-700 font-bold bg-pink-50/50">∞ Unlimited</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-2 text-pink-900 font-medium">💑 Couple Budgeting</td>
                  <td className="text-center text-slate-400 bg-slate-50/30">✕</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-2 text-pink-900 font-medium">📥 Export E-Receipt</td>
                  <td className="text-center text-slate-400 bg-slate-50/30">✕</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-2 text-pink-900 font-medium">🖼️ Custom Wallpaper</td>
                  <td className="text-center text-slate-400 bg-slate-50/30">✕</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-2 text-pink-900 font-medium">☁️ Cloud Backup</td>
                  <td className="text-center text-slate-400 bg-slate-50/30">✕</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2 text-pink-900 font-medium">💬 Priority Support</td>
                  <td className="text-center text-slate-400 bg-slate-50/30">✕</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
              </tbody>
            </table>

            {/* Upgrade note */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center">
              <p className="text-[10px] text-amber-800 font-semibold">
                💡 Sudah member Basic? Upgrade ke Premium hanya <b>+Rp 38K</b>!
              </p>
            </div>

            {/* CTA */}
            <a
              href={`https://wa.me/6281575859792?text=Halo%20Julyo%2C%20saya%20mau%20tanya%20tentang%20paket%20Budgeting%20App`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-sm"
            >
              💬 Tanya / Daftar via WhatsApp
            </a>
          </div>
        </details>

        {/* Footer */}
        <p className="text-[10px] text-pink-800/50">
          Growsphere Digital Product · Crafted with ❤️ by Julyo Sechar
        </p>
      </div>
    </main>
  )
}
