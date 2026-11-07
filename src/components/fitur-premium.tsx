'use client'

import { useTier } from '@/lib/hooks/use-tier'
import { PRICING, TIER_INFO } from '@/lib/constants/tiers'

interface Props {
  onBack: () => void
}

const WA_NUMBER = '6281575859792'
const WA_LINK_UPGRADE = `https://wa.me/${WA_NUMBER}?text=Halo%20Julyo%2C%20saya%20mau%20upgrade%20ke%20Premium%20tier%20Budgeting%20App`

const BENEFITS = [
  {
    icon: '💑',
    title: 'Couple Budgeting',
    desc: 'Share data budgeting dengan pasangan Anda — saling bantu input & crosscheck transaksi',
  },
  {
    icon: '🎨',
    title: '8 Tema Premium',
    desc: 'Rose Gold Luxe, Cherry Blossom, Lavender Dream, Sunset Coral, Pearl Blush, dan lainnya',
  },
  {
    icon: '🐾',
    title: '10 Maskot Premium',
    desc: 'Panda, Owl, Unicorn, Bear, Dog, Butterfly — pilih maskot favorit Anda',
  },
  {
    icon: '📥',
    title: 'Export E-Receipt',
    desc: 'Download e-receipt bulanan sebagai PNG — siap di-share atau disimpan',
  },
  {
    icon: '☁️',
    title: 'Cloud Backup & Restore',
    desc: 'Data aman tersimpan di cloud — bisa restore kapan saja di perangkat baru',
  },
  {
    icon: '📊',
    title: 'Unlimited Custom Categories',
    desc: 'Buat kategori & sub-kategori custom tanpa batas (Basic tier: max 5)',
  },
  {
    icon: '💬',
    title: 'Priority WhatsApp Support',
    desc: 'Respon prioritas < 4 jam via WhatsApp langsung ke developer',
  },
]

export default function FiturPremiumPage({ onBack }: Props) {
  const { tier, isPremium, isVip, isAdmin, subscriptionInfo } = useTier()

  const isAlreadyPremium = isPremium || isVip || isAdmin
  const tierInfo = tier ? TIER_INFO[tier] : null

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="wallpaper-bg" aria-hidden="true" />
      <div className="wallpaper-veil" aria-hidden="true" />

      {/* Header */}
      <header
        className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-pink-200/50 px-4 py-3 flex items-center gap-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 font-bold flex items-center justify-center hover:bg-pink-200 transition shrink-0"
        >
          ←
        </button>
        <div>
          <h1 className="text-base font-bold text-pink-950">💎 Fitur Premium</h1>
          <p className="text-[10px] text-pink-700/60">
            Unlock pengalaman budgeting terbaik Anda
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 pb-32 relative z-10 space-y-4">
        {/* Hero pricing card or status card */}
        {!isAlreadyPremium ? (
          /* Pricing card for non-premium users — wrapped with rotating border */
          <div className="premium-modal-border animate-pop">
            <div className="premium-modal-inner bg-slate-900 p-6 text-white shadow-xl overflow-hidden relative">
              {/* Light sweep */}
              <div className="premium-sweep" aria-hidden="true" />
              <div className="relative z-10 text-center">
                <p className="text-[10px] uppercase tracking-wider text-pink-100 font-bold mb-1">
                  Premium Tier
                </p>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-black tracking-tight">
                    Rp {PRICING.premium_annual.toLocaleString('id-ID')}
                  </span>
                  <span className="text-sm text-pink-100">/tahun</span>
                </div>
                <p className="text-[11px] text-pink-100/90">
                  atau Rp {PRICING.basic_annual.toLocaleString('id-ID')} untuk Basic tier
                </p>

                {/* Trial promo */}
                <div className="mt-4 bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl p-3">
                  <p className="text-xs font-bold text-white">
                    🎁 Bonus Welcome: {PRICING.trial_days} hari FREE TRIAL
                  </p>
                  <p className="text-[10px] text-pink-50/90 mt-1">
                    Saat signup, Anda otomatis dapat {PRICING.trial_days} hari Premium GRATIS.
                    Setelah trial, lanjut ke Basic atau upgrade Premium.
                  </p>
                </div>
              </div>

              {/* Decorative bling */}
              <div className="absolute -top-4 -right-4 text-5xl opacity-20">✨</div>
              <div className="absolute -bottom-4 -left-4 text-5xl opacity-20">💎</div>
            </div>
          </div>
        ) : (
          /* Status card for premium users — wrapped with rotating border */
          <div className="premium-modal-border animate-pop">
            <div className="premium-modal-inner bg-slate-900 p-6 text-center overflow-hidden relative">
              <div className="premium-sweep" aria-hidden="true" />
              <div className="relative z-10">
                <div className="text-4xl mb-2">
                  {tier === 'admin' ? '👑' : tier === 'vip' ? '⭐' : '💎'}
                </div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-1">
                  Anda sudah member {tierInfo?.label ?? 'Premium'}!
                </p>
                <p className="text-xs text-slate-300 mb-3">
                  {tier === 'admin'
                    ? 'Super admin — full access, tidak ada expiry.'
                    : tier === 'vip'
                    ? 'VIP member — semua fitur + exclusive mascot, tanpa expiry.'
                    : subscriptionInfo?.tier_expires_at
                    ? `Berlaku hingga: ${new Date(subscriptionInfo.tier_expires_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : 'Semua fitur Premium aktif untuk Anda.'}
                </p>
                {subscriptionInfo?.days_until_expiry !== null &&
                  subscriptionInfo?.days_until_expiry !== undefined &&
                  subscriptionInfo.days_until_expiry > 0 && (
                    <p className="text-[11px] text-emerald-400 font-bold">
                      {subscriptionInfo.days_until_expiry} hari lagi
                    </p>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Benefits list */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-pink-950/80 mb-3">
            ✨ Benefit Premium
          </h2>
          <div className="space-y-2.5">
            {BENEFITS.map((benefit, idx) => (
              <div
                key={idx}
                className="bg-white/70 backdrop-blur-md rounded-2xl p-3 border border-pink-200/60 shadow-sm flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 border border-pink-200 flex items-center justify-center text-xl shrink-0">
                  {benefit.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-pink-950">{benefit.title}</h3>
                  <p className="text-[11px] text-pink-700/70 mt-0.5 leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
                {isAlreadyPremium && (
                  <span className="text-emerald-500 text-base shrink-0" title="Aktif">
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comparison table */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-pink-200/60 shadow-sm">
          <h3 className="text-xs font-bold text-pink-950 mb-3">📊 Perbandingan Tier</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-pink-200">
                  <th className="text-left py-2 px-1 font-bold text-pink-700">Fitur</th>
                  <th className="text-center py-2 px-1 font-bold text-slate-600 bg-slate-50/50 rounded-t-lg">
                    Basic<br />
                    <span className="text-[11px] font-black">Rp 50K</span>
                    <span className="text-[8px] text-slate-500">/tahun</span>
                  </th>
                  <th className="text-center py-2 px-1 font-bold text-pink-700 bg-pink-50 rounded-t-lg">
                    Premium<br />
                    <span className="text-[11px] font-black">Rp 88K</span>
                    <span className="text-[8px] text-pink-500">/tahun</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-1 text-pink-900">5 Modul Utama</td>
                  <td className="text-center text-emerald-600">✓</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-1 text-pink-900">PIN Lock + Cara Pakai</td>
                  <td className="text-center text-emerald-600">✓</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-1 text-pink-900">Tema & Maskot</td>
                  <td className="text-center text-slate-500">2 + 3</td>
                  <td className="text-center text-pink-700 font-bold bg-pink-50/50">8 + 10</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-1 text-pink-900">Custom Categories</td>
                  <td className="text-center text-slate-500">Max 5</td>
                  <td className="text-center text-pink-700 font-bold bg-pink-50/50">∞</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-1 text-pink-900">Couple Budgeting</td>
                  <td className="text-center text-slate-400">✕</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-1 text-pink-900">Export E-Receipt PNG</td>
                  <td className="text-center text-slate-400">✕</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr className="border-b border-pink-100">
                  <td className="py-1.5 px-1 text-pink-900">Cloud Backup</td>
                  <td className="text-center text-slate-400">✕</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-1 text-pink-900">Priority Support</td>
                  <td className="text-center text-slate-400">✕</td>
                  <td className="text-center text-emerald-600 bg-pink-50/50">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA / Action buttons */}
        {!isAlreadyPremium ? (
          <>
            <a
              href={WA_LINK_UPGRADE}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg transition text-center text-sm"
            >
              💬 Upgrade via WhatsApp — Rp {PRICING.premium_annual.toLocaleString('id-ID')}
            </a>
            <p className="text-[10px] text-pink-700/60 text-center italic">
              Setelah pembayaran terverifikasi, admin akan mengaktifkan Premium tier Anda.
            </p>
          </>
        ) : (
          <>
            <a
              href={WA_LINK_UPGRADE}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg transition text-center text-sm"
            >
              💬 Extend Subscription
            </a>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=Halo%20Julyo%2C%20saya%20mau%20tanya%20tentang%20akun%20Premium%20saya`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-white/70 hover:bg-white/90 text-pink-950 font-semibold py-2.5 px-4 rounded-2xl border border-pink-200/60 shadow-sm transition text-center text-sm"
            >
              📞 Contact Support
            </a>
          </>
        )}

        {/* Back button */}
        <button
          onClick={onBack}
          className="w-full bg-white/70 hover:bg-white/90 text-pink-950 font-bold py-3 px-4 rounded-xl border border-pink-200/60 shadow-sm transition text-sm mt-4"
        >
          ← Kembali ke Menu Utama
        </button>

        {/* Footer */}
        <p className="text-[10px] text-pink-800/40 text-center mt-4">
          Growsphere Digital Product · Crafted by Julyo Sechar
        </p>
      </main>
    </div>
  )
}
