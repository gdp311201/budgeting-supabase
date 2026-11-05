'use client'

interface Props {
  nickname: string | null
  onNavigate: (view: 'dashboard' | 'cara-pakai' | 'setting') => void
}

export default function WelcomePage({ nickname, onNavigate }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Glassmorphism wallpaper */}
      <div className="wallpaper-bg" aria-hidden="true" />
      <div className="wallpaper-veil" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm text-center space-y-6">
        {/* GDP Text Logo */}
        <div>
          <h1
            className="text-5xl font-black tracking-[0.15em] mb-1"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 2px 8px rgba(236, 72, 153, 0.3))',
            }}
          >
            GDP
          </h1>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-pink-700/60">
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
