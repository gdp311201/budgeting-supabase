'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const STORAGE_KEY = 'bms_welcomed'
const GDP_LOGO = 'https://qxarqpbwbsxlbectwgba.supabase.co/storage/v1/object/public/logo/GDP_logo.png'

interface Props {
  nickname: string | null
  onClose: () => void
}

/**
 * WelcomeGreetingModal — First-time login greeting
 *
 * Shows ONCE per device (localStorage flag).
 * Elegant: rotating border + glassmorphism + floating GDP logo.
 */
export default function WelcomeGreetingModal({ nickname, onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if already welcomed
    if (typeof window !== 'undefined') {
      const welcomed = localStorage.getItem(STORAGE_KEY)
      if (!welcomed) {
        // Small delay for smooth entrance
        const timer = setTimeout(() => setVisible(true), 500)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  function handleClose() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    setVisible(false)
    setTimeout(onClose, 300)
  }

  if (!mounted || !visible || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-pink-950/60 backdrop-blur-md"
      onClick={handleClose}
    >
      <div
        className="premium-modal-border w-full max-w-sm animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="premium-modal-inner bg-white/80 backdrop-blur-xl rounded-[calc(1.5rem-2px)] p-6 shadow-2xl text-center">
          {/* GDP Logo with floating glow */}
          <div className="mascot-float-glow mb-3">
            <div className="w-20 h-20 mx-auto">
              <img
                src={GDP_LOGO}
                alt="GDP"
                className="w-full h-full object-contain"
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))' }}
              />
            </div>
          </div>

          {/* Greeting */}
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-700/70 mb-1">
            Selamat Datang
          </p>
          <h2 className="text-xl font-bold text-pink-950 mb-2">
            Hi, {nickname ?? 'Anda'}! 👋
          </h2>
          <p className="text-sm text-pink-800/70 leading-relaxed mb-4">
            Selamat bergabung di <b className="text-pink-700">GDP Budgeting</b> —
            aplikasi budgeting personal yang cantik, cerdas, dan milik Anda.
          </p>

          {/* Quick tips */}
          <div className="bg-pink-50/80 border border-pink-200/60 rounded-2xl p-3 space-y-2 mb-4 text-left">
            <p className="text-[10px] uppercase tracking-wider font-bold text-pink-700 mb-1">
              🚀 Mulai dari sini:
            </p>
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">📊</span>
              <p className="text-[11px] text-pink-900/80">
                <b>Dashboard</b> — Lihat ringkasan keuangan bulanan Anda
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">✏️</span>
              <p className="text-[11px] text-pink-900/80">
                <b>Input Transaksi</b> — Catat pemasukan & pengeluaran harian
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">⚙️</span>
              <p className="text-[11px] text-pink-900/80">
                <b>Settings</b> — Atur akun bank, kategori, & budget
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">💎</span>
              <p className="text-[11px] text-pink-900/80">
                <b>Fitur Premium</b> — Unlock Couple Budgeting & tema eksklusif
              </p>
            </div>
          </div>

          {/* Trial info */}
          <div className="bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl p-3 mb-4">
            <p className="text-xs font-bold">🎁 3 Hari FREE TRIAL Premium!</p>
            <p className="text-[10px] text-white/80 mt-0.5">
              Nikmati semua fitur premium gratis selama 3 hari
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-lg"
          >
            🚀 Mulai Budgeting
          </button>

          <p className="text-[9px] text-pink-700/50 mt-3">
            Growsphere Digital Product · Crafted by Julyo Sechar
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
