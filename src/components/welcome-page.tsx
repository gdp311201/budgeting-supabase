'use client'

interface Props {
  nickname: string | null
  onNavigate: (view: 'dashboard' | 'cara-pakai' | 'setting') => void
}

const GDP_LOGO = 'https://qxarqpbwbsxlbectwgba.supabase.co/storage/v1/object/public/logo/GDP_logo.png'

export default function WelcomePage({ nickname, onNavigate }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Glassmorphism wallpaper */}
      <div className="wallpaper-bg" aria-hidden="true" />
      <div className="wallpaper-veil" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm text-center space-y-6">
        {/* GDP Logo + Subtitle */}
        <div>
          <div className="w-[60px] h-[60px] mx-auto mb-2">
            <img
              src={GDP_LOGO}
              alt="GDP"
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))' }}
            />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-black">
            Personal Budgeting
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
              <p className="text-[10px] text-white/80">Lihat ringkasan keuanganmu</p>
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

          {/* Setting */}
          <button
            onClick={() => onNavigate('setting')}
            className="w-full bg-white/70 backdrop-blur-md hover:bg-white/90 text-pink-950 font-bold py-4 px-6 rounded-2xl shadow-lg border border-pink-200/60 transition hover:scale-[1.02] flex items-center gap-3"
          >
            <span className="text-2xl">⚙️</span>
            <div className="text-left flex-1">
              <p className="text-sm font-bold">Setting</p>
              <p className="text-[10px] text-pink-700/60">Atur akun, kategori & budget</p>
            </div>
            <span className="text-pink-400">→</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[11px] font-bold text-pink-800/60">
            Growsphere Digital Product
          </p>
          <p className="text-[10px] text-pink-700/50 mt-0.5">
            by : Julyo Sechar
          </p>
        </div>
      </div>
    </div>
  )
}
