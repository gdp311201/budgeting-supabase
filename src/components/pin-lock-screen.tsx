'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  mode: 'setup' | 'lock'
  onUnlock: () => void
  onSkip?: () => void
}

// Simple SHA-256 hash using Web Crypto API
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'bms_salt_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

const PIN_STORAGE_KEY = 'bms_pin_hash'
const MAX_ATTEMPTS = 3

export default function PinLockScreen({ mode, onUnlock, onSkip }: Props) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'input' | 'confirm'>('input')
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  async function handleSubmit() {
    setError(null)

    if (pin.length !== 6) {
      setError('PIN harus 6 digit')
      return
    }

    if (mode === 'setup') {
      if (step === 'input') {
        setStep('confirm')
        return
      }

      // Confirm step
      if (pin !== confirmPin) {
        setError('PIN tidak cocok. Coba lagi.')
        setPin('')
        setConfirmPin('')
        setStep('input')
        return
      }

      // Save PIN hash
      const hash = await hashPin(pin)
      localStorage.setItem(PIN_STORAGE_KEY, hash)
      onUnlock()
    } else {
      // Lock mode — verify
      const storedHash = localStorage.getItem(PIN_STORAGE_KEY)
      const inputHash = await hashPin(pin)

      if (inputHash === storedHash) {
        onUnlock()
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        if (newAttempts >= MAX_ATTEMPTS) {
          // Force re-auth
          setError('Terlalu banyak percobaan. Silakan login ulang.')
          setTimeout(() => {
            const supabase = createClient()
            supabase.auth.signOut()
            localStorage.removeItem(PIN_STORAGE_KEY)
            window.location.href = '/login'
          }, 2000)
        } else {
          setError(`PIN salah. Sisa percobaan: ${MAX_ATTEMPTS - newAttempts}`)
          setPin('')
        }
      }
    }
  }

  async function handleReset() {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem(PIN_STORAGE_KEY)
    window.location.href = '/login'
  }

  function handlePinChange(val: string) {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 6)
    setPin(clean)
    setError(null)
  }

  function handleConfirmChange(val: string) {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 6)
    setConfirmPin(clean)
    setError(null)
  }

  const isSetup = mode === 'setup'
  const isConfirmStep = isSetup && step === 'confirm'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-pink-950/80 backdrop-blur-lg">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-xs w-full p-6 text-center">
        {/* Icon */}
        <div className="text-4xl mb-3">{isSetup ? '🔐' : '🔒'}</div>

        {/* Title */}
        <h2 className="text-lg font-bold text-pink-950 mb-1">
          {isSetup ? (isConfirmStep ? 'Konfirmasi PIN' : 'Setup PIN') : 'Masukkan PIN'}
        </h2>
        <p className="text-xs text-pink-800/70 mb-4">
          {isSetup
            ? isConfirmStep
              ? 'Masukkan lagi PIN yang sama untuk konfirmasi'
              : 'Buat PIN 6 digit untuk mengamankan app kamu'
            : 'Masukkan PIN 6 digit kamu untuk lanjut'}
        </p>

        {/* PIN Input */}
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={isConfirmStep ? confirmPin : pin}
          onChange={(e) => isConfirmStep ? handleConfirmChange(e.target.value) : handlePinChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="• • • • • •"
          className="w-full text-center text-2xl font-bold tracking-[0.5em] py-3 px-3 rounded-xl bg-white/80 border-2 border-pink-200 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100 text-pink-950 mb-3"
          autoFocus
        />

        {/* Error */}
        {error && (
          <p className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg py-1.5 px-2 mb-3">
            ⚠️ {error}
          </p>
        )}

        {/* Buttons */}
        <button
          onClick={handleSubmit}
          disabled={(isConfirmStep ? confirmPin : pin).length !== 6}
          className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-40 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition text-sm mb-2"
        >
          {isSetup ? (isConfirmStep ? '✓ Simpan PIN' : 'Lanjut →') : '🔓 Buka'}
        </button>

        {/* Secondary actions */}
        {isSetup && onSkip && (
          <button
            onClick={onSkip}
            className="w-full text-pink-700/60 hover:text-pink-900 text-xs font-medium py-1"
          >
            Skip for now
          </button>
        )}

        {!isSetup && (
          <button
            onClick={handleReset}
            className="w-full text-pink-700/60 hover:text-pink-900 text-xs font-medium py-1"
          >
            Lupa PIN? Login ulang
          </button>
        )}

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-3">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition ${
                i < (isConfirmStep ? confirmPin : pin).length
                  ? 'bg-pink-500'
                  : 'bg-pink-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
