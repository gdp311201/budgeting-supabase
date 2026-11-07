'use client'

interface Props {
  nickname: string | null
  onNavigate: (view: 'fitur-premium' | 'dashboard' | 'cara-pakai') => void
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
          <div className="w-16 h-16 mx-auto mb-2 animate-pulse">
            <img
              src="https://qxarqpbwbsxlbectwgba.supabase.co/storage/v1/object/public/logo/GDP_logo.png"
              alt="GDP"
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))' }}
            />
          </div>
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

        {/* 3 Menu Buttons — Premium Glassmorphism Style */}
        <div className="space-y-3">
          {/* 💎 Fitur Premium — FIRST (CTA priority) */}
          <button
            onClick={() => onNavigate('fitur-premium')}
            className="w-full relative overflow-hidden bg-white/50 backdrop-blur-xl hover:bg-white/70 text-pink-950 font-bold py-4 px-6 rounded-2xl shadow-xl border border-white/60 transition hover:scale-[1.02] flex items-center gap-3 group"
            style={{
              boxShadow: '0 8px 32px rgba(236, 72, 153, 0.15), inset 0 1px 1px rgba(255,255,255,0.6)',
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="text-2xl relative z-10">💎</span>
            <div className="text-left flex-1 relative z-10">
              <p className="text-sm font-bold">Fitur Premium</p>
              <p className="text-[10px] text-pink-700/60">Unlock semua fitur eksklusif</p>
            </div>
            <span className="text-[8px] bg-pink-500 text-white px-2 py-0.5 rounded-full font-bold relative z-10">PRO</span>
          </button>

          {/* 📊 Dashboard — SECOND */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full relative overflow-hidden bg-white/50 backdrop-blur-xl hover:bg-white/70 text-pink-950 font-bold py-4 px-6 rounded-2xl shadow-xl border border-white/60 transition hover:scale-[1.02] flex items-center gap-3 group"
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255,255,255,0.6)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="text-2xl relative z-10">📊</span>
            <div className="text-left flex-1 relative z-10">
              <p className="text-sm font-bold">Dashboard</p>
              <p className="text-[10px] text-pink-700/60">Lihat ringkasan keuangan Anda</p>
            </div>
            <span className="text-pink-400 relative z-10">→</span>
          </button>

          {/* 📖 Cara Pakai — THIRD */}
          <button
            onClick={() => onNavigate('cara-pakai')}
            className="w-full relative overflow-hidden bg-white/50 backdrop-blur-xl hover:bg-white/70 text-pink-950 font-bold py-4 px-6 rounded-2xl shadow-xl border border-white/60 transition hover:scale-[1.02] flex items-center gap-3 group"
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255,255,255,0.6)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="text-2xl relative z-10">📖</span>
            <div className="text-left flex-1 relative z-10">
              <p className="text-sm font-bold">Cara Pakai</p>
              <p className="text-[10px] text-pink-700/60">Panduan lengkap menggunakan app</p>
            </div>
            <span className="text-pink-400 relative z-10">→</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-pink-800/40 mt-8">
          Growsphere Digital Product · Crafted by Julyo Sechar
        </p>
      </div>
    </div>
  )
}
