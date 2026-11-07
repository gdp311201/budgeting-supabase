'use client'

interface Props {
  nickname: string | null
  onNavigate: (view: 'dashboard' | 'cara-pakai' | 'fitur-premium') => void
}

export default function WelcomePage({ nickname, onNavigate }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Glassmorphism wallpaper */}
      <div className="wallpaper-bg" aria-hidden="true" />
      <div className="wallpaper-veil" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm text-center space-y-6">
        {/* Greeting */}
        <div>
          <div className="text-5xl mb-2 animate-pulse">🐘</div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-700/70">
            Selamat Datang
          </p>
          <h1 className="text-2xl font-bold text-pink-950 mt-1">
            Hi, {nickname ?? 'Anda'}! 👋
          </h1>
          <p className="text-xs text-pink-800/60 mt-2">
            Mau mulai apa hari ini?
          </p>
        </div>

        {/* 3 Menu Buttons */}
        <div className="space-y-3">
          {/* Dashboard */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition hover:scale-[1.02] flex items-center gap-3"
          >
            <span className="text-2xl">📊</span>
            <div className="text-left flex-1">
              <p className="text-sm font-bold">Dashboard</p>
              <p className="text-[10px] text-white/80">Lihat ringkasan keuangan Anda</p>
            </div>
            <span className="text-white/60">→</span>
          </button>

          {/* Cara Pakai */}
          <button
            onClick={() => onNavigate('cara-pakai')}
            className="w-full bg-white/70 backdrop-blur-md hover:bg-white/90 text-pink-950 font-bold py-4 px-6 rounded-2xl shadow-lg border border-pink-200/60 transition hover:scale-[1.02] flex items-center gap-3"
          >
            <span className="text-2xl">📖</span>
            <div className="text-left flex-1">
              <p className="text-sm font-bold">Cara Pakai</p>
              <p className="text-[10px] text-pink-700/60">Panduan lengkap menggunakan app</p>
            </div>
            <span className="text-pink-400">→</span>
          </button>

          {/* Fitur Premium (NEW) */}
          <button
            onClick={() => onNavigate('fitur-premium')}
            className="w-full bg-gradient-to-r from-amber-300 to-yellow-400 hover:from-amber-400 hover:to-yellow-500 text-amber-950 font-bold py-4 px-6 rounded-2xl shadow-lg border border-amber-200/60 transition hover:scale-[1.02] flex items-center gap-3 relative overflow-hidden"
          >
            <span className="text-2xl">💎</span>
            <div className="text-left flex-1">
              <p className="text-sm font-bold">Fitur Premium</p>
              <p className="text-[10px] text-amber-900/70">
                Unlock semua fitur + Couple Budgeting
              </p>
            </div>
            <span className="text-amber-700">→</span>
            {/* Decorative shimmer */}
            <span className="absolute top-0 right-0 text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-bl-lg font-bold">
              PRO
            </span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-pink-800/40 mt-8">
          Growsphere Digital Product · Made with ❤️
        </p>
      </div>
    </div>
  )
}
