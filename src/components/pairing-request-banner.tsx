'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/format'

interface PendingRequest {
  request_id: string
  from_user_id: string
  from_email: string
  from_name: string | null
  from_tier: string
  requested_at: string
  days_remaining: number
}

interface Props {
  onAccept: () => void
}

const STORAGE_KEY = 'bms_pairing_dismissed'

/**
 * PairingRequestBanner — Banner on dashboard showing pending pairing requests
 *
 * Shows when user has pending pairing requests from other users.
 * User can click to accept/reject (opens CoupleBudgetingModal).
 */
export default function PairingRequestBanner({ onAccept }: Props) {
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])

  const loadRequests = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_pending_pairing_requests')
      if (error) {
        console.warn('Failed to fetch pairing requests:', error.message)
        return
      }
      const result = data as any
      setRequests(result?.requests ?? [])
    } catch (err: any) {
      console.warn('Failed to fetch pairing requests:', err.message)
    }
  }, [])

  useEffect(() => {
    // Load dismissed requests from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          setDismissed(JSON.parse(stored))
        } catch {
          setDismissed([])
        }
      }
    }
    loadRequests()
    const interval = setInterval(loadRequests, 60_000) // Poll every 60s
    return () => clearInterval(interval)
  }, [loadRequests])

  // Filter out dismissed requests
  const visibleRequests = requests.filter(r => !dismissed.includes(r.request_id))

  if (visibleRequests.length === 0) return null

  const req = visibleRequests[0] // Show first request

  function handleDismiss() {
    const newDismissed = [...dismissed, req.request_id]
    setDismissed(newDismissed)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDismissed))
    }
  }

  function handleAccept() {
    onAccept()
  }

  return (
    <div className="mx-auto max-w-md px-3 py-2.5 rounded-2xl border shadow-md text-white text-xs font-bold flex items-center justify-between gap-2 bg-gradient-to-r from-purple-500 to-pink-500 border-purple-300">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-base shrink-0">💑</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-extrabold leading-tight">
            Pairing Request dari {req.from_name || req.from_email}
          </p>
          <p className="text-[9px] opacity-90 leading-tight mt-0.5">
            Share data budgeting? {req.days_remaining} hari lagi
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleAccept}
          className="bg-white/25 hover:bg-white/40 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold transition"
        >
          Lihat
        </button>
        <button
          onClick={handleDismiss}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
