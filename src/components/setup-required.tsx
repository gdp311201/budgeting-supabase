/**
 * Setup Required page — shown when Supabase env vars aren't configured yet.
 * Helps users understand what to do next.
 */
export default function SetupRequired() {
  const steps = [
    {
      num: 1,
      title: 'Create Supabase Project',
      desc: 'Go to supabase.com → New Project (Singapore region)',
      link: 'https://supabase.com',
    },
    {
      num: 2,
      title: 'Copy .env.example to .env.local',
      desc: 'Fill in NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY',
    },
    {
      num: 3,
      title: 'Run SQL files in Supabase SQL Editor',
      desc: 'Run supabase/01_schema.sql → 02_policies.sql → 03_functions.sql → 04_seed.sql (in order)',
    },
    {
      num: 4,
      title: 'Configure Google OAuth',
      desc: 'Google Cloud Console → OAuth credentials → add redirect URI: http://localhost:3000/auth/callback. Then enable Google provider in Supabase Auth settings.',
    },
    {
      num: 5,
      title: 'Restart dev server',
      desc: 'bun run dev — then refresh this page',
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-3 animate-pulse">🐘</div>
          <h1 className="text-3xl font-bold text-pink-950 tracking-tight">
            Budgeting Master Sync
          </h1>
          <p className="text-sm text-pink-800/70 mt-2">
            Starter template — Next.js 16 + Supabase + TypeScript
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-900">
            ⚠️ Setup Required — Supabase not configured yet
          </div>
        </div>

        {/* Setup Steps */}
        <div className="bg-white/70 backdrop-blur-md border border-white/70 rounded-2xl p-6 shadow-xl space-y-5">
          <h2 className="text-lg font-bold text-pink-950">
            📋 Setup Checklist
          </h2>

          {steps.map((step) => (
            <div
              key={step.num}
              className="flex gap-4 items-start pb-4 border-b border-pink-100/60 last:border-0 last:pb-0"
            >
              <div className="w-8 h-8 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center text-sm shrink-0">
                {step.num}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-pink-950">
                  {step.title}
                </h3>
                <p className="text-xs text-pink-800/70 mt-0.5 leading-relaxed">
                  {step.desc}
                </p>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 text-xs text-pink-600 hover:text-pink-700 underline font-semibold"
                  >
                    Open ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tech stack badges */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            'Next.js 16',
            'TypeScript',
            'Supabase',
            'Tailwind CSS 4',
            'shadcn/ui',
            'PWA',
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-white/60 border border-pink-200/60 rounded-full text-[10px] font-semibold text-pink-900"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-pink-800/50 mt-6">
          📖 Full setup instructions: see README.md
          <br />
          Happy budgeting! 💰
        </p>
      </div>
    </main>
  )
}
