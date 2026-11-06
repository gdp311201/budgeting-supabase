'use client'

import { useTier } from '@/lib/hooks/use-tier'

/**
 * ReadOnlyOverlay — blocks inputs when user tier is 'expired' or 'suspended'
 *
 * Behavior:
 * - Renders a full-screen overlay with "Subscription Expired" message
 * - Blocks all clicks/interactions with underlying app
 * - Shows "Renew Premium" CTA button + "Stay Basic" alternative
 *
 * Used in: budgeting-app.tsx (rendered at root level when tier = expired)
 */
export default function ReadOnlyOverlay() {
  const { tier, isReadOnly } = useTier()

  // Only render when in read-only mode (expired or suspended)
  if (!isReadOnly) return null

  const isExpired = tier === 'expired'
  const isSuspended = tier === 'suspended'

  const waLink =
    'https://wa.me/62XXXXXXXXXXX?text=Halo%20Julyo%2C%20saya%20mau%20renew%20subscription%20Budgeting%20App'

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-pink-950/80 backdrop-blur-md">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center">
        {/* Icon */}
        <div className="text-6xl mb-3">
          {isSuspended ? '🚫' : '🔒'}
        </div>

        {/* Title */}
        <h2 className="text-lg font-black text-pink-950 mb-2 tracking-wide">
          {isSuspended ? 'Account Suspended' : 'Subscription Expired'}
        </h2>

        {/* Message */}
        {isSuspended ? (
          <>
            <p className="text-xs text-pink-800/80 mb-4 leading-relaxed">
              Akun Anda telah di-suspend oleh admin. Silakan hubungi support untuk informasi
              lebih lanjut.
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow-md"
            >
              💬 Contact Support
            </a>
          </>
        ) : (
          <>
            <p className="text-xs text-pink-800/80 mb-4 leading-relaxed">
              Your subscription has expired. You can still <b>view</b> your data, but
              <b> adding, editing, or deleting transactions</b> is locked.
            </p>

            {/* Pricing reminder */}
            <div className="bg-pink-50 border border-pink-200 rounded-2xl p-3 mb-4">
              <p className="text-[10px] uppercase tracking-wider font-bold text-pink-700 mb-1">
                Renew Premium
              </p>
              <p className="text-xl font-black text-pink-950">Rp 88.000<span className="text-xs font-normal text-pink-700">/year</span></p>
              <ul className="text-[10px] text-pink-700/70 mt-2 space-y-0.5">
                <li>✓ All themes & mascots</li>
                <li>✓ Couple Budgeting</li>
                <li>✓ Export reports</li>
                <li>✓ Priority support</li>
              </ul>
            </div>

            {/* Renew button (WhatsApp CTA) */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow-md mb-2"
            >
              💬 Renew via WhatsApp
            </a>

            <p className="text-[10px] text-pink-700/60 italic mt-3">
              Setelah pembayaran verified, admin akan renew subscription Anda. Refresh halaman ini untuk cek status.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-2 w-full text-pink-700/60 hover:text-pink-900 text-xs font-medium py-1"
            >
              ↻ Refresh status
            </button>
          </>
        )}
      </div>
    </div>
  )
}
