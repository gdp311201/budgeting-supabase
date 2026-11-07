'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  featureName?: string
}

const WA_LINK = 'https://wa.me/6281575859792?text=Halo%20Julyo%2C%20saya%20mau%20upgrade%20ke%20Premium%20Budgeting%20App'

const PREMIUM_BENEFITS = [
  '🎨 8 Tema Warna Premium',
  '🐾 10 Maskot Premium',
  '💑 Couple Budgeting (Share dengan pasangan)',
  '📥 Export E-Receipt ke PNG',
  '🖼️ Custom Wallpaper Upload',
  '☁️ Cloud Backup & Restore',
  '📊 Unlimited Custom Categories',
  '💬 Priority WhatsApp Support',
]

/**
 * UpgradeRequiredModal — Center popup CTA for basic users
 *
 * Shown when basic user clicks a locked premium feature (theme, mascot, etc.)
 * User must click "Nanti saja" to close (backdrop click also closes).
 */
export default function UpgradeRequiredModal({
  open,
  onClose,
  featureName,
}: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!open || !mounted || typeof document === 'undefined') return null

  const defaultMessage = featureName
    ? `${featureName} adalah fitur Premium. Upgrade sekarang untuk membukanya!`
    : 'Fitur ini eksklusif untuk member Premium.'

  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-pink-950/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white/95 w-full max-w-xs rounded-3xl p-5 text-center shadow-2xl animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Big icon */}
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-gradient-to-br from-amber-100 to-yellow-100 border border-amber-200">
          🔒
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-pink-950 mb-1">Upgrade ke Premium</h3>
        <p className="text-[11px] text-pink-700/70 mb-3 leading-relaxed">
          {defaultMessage}
        </p>

        {/* Pricing */}
        <div className="bg-pink-50 border border-pink-100 rounded-xl p-3 mb-3">
          <p className="text-[10px] uppercase tracking-wider font-bold text-pink-700">
            💎 Premium
          </p>
          <p className="text-lg font-black text-pink-950 mt-0.5">
            Rp 88.000<span className="text-xs font-normal text-pink-700">/tahun</span>
          </p>
          <p className="text-[10px] text-amber-700 mt-1 font-semibold">
            Sudah Basic? Upgrade hanya +Rp 38K!
          </p>
        </div>

        {/* Benefits list */}
        <div className="text-left bg-pink-50/50 border border-pink-100/50 rounded-xl px-3 py-2 mb-3 space-y-0.5">
          {PREMIUM_BENEFITS.map((benefit, idx) => (
            <p key={idx} className="text-[10px] text-pink-900/70 flex items-start gap-1">
              <span className="text-pink-400 shrink-0">✓</span>
              <span>{benefit}</span>
            </p>
          ))}
        </div>

        {/* CTA button */}
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="block w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm mb-2"
        >
          💬 Upgrade via WhatsApp
        </a>

        {/* Dismiss button */}
        <button
          onClick={onClose}
          className="w-full text-pink-700/60 hover:text-pink-900 text-xs font-medium py-1"
        >
          Nanti saja
        </button>
      </div>
    </div>,
    document.body
  )
}
