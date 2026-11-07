'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ShareableUser } from '@/lib/api/subscription'
import { cn } from '@/lib/utils/format'

interface Props {
  /** Controlled open state — parent controls visibility */
  open: boolean
  /** Close handler — parent sets open=false */
  onClose: () => void
  /** Currently active user ID (null = my own data) */
  activeUserId: string | null
  /** List of users I can switch to */
  shareableUsers: ShareableUser[]
  /** My own info */
  myEmail: string
  myNickname: string | null
  /** Callback when user selects account */
  onSwitch: (userId: string | null) => void
}

/**
 * AccountSwitcherModal — CENTER POPUP modal for account switching
 *
 * Sprint 3A Refactor:
 * - Removed internal trigger button (now controlled by parent)
 * - Accepts `open` & `onClose` props
 * - Rendered via createPortal to bypass backdrop-filter containing block
 * - Style matches DeleteConfirmModal (big icon, title, card list, close button)
 */
export default function AccountSwitcherModal({
  open,
  onClose,
  activeUserId,
  shareableUsers,
  myEmail,
  myNickname,
  onSwitch,
}: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!open || !mounted || typeof document === 'undefined') return null

  const isMyBudget = activeUserId === null
  const currentIcon = isMyBudget ? '👤' : '📊'

  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-pink-950/40 backdrop-blur-[5px]"
      onClick={onClose}
    >
      <div
        className="bg-white/95 w-full max-w-xs rounded-3xl p-5 text-center shadow-2xl animate-pop premium-modal-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Big icon at top */}
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-pink-100 border border-pink-200">
          {currentIcon}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-pink-950 mb-1">Switch Account</h3>
        <p className="text-[11px] text-pink-700/70 mb-3">
          Pilih akun untuk melihat data
        </p>

        {/* Account list card */}
        <div className="text-left bg-pink-50 border border-pink-100 rounded-xl px-3 py-2 mb-3 space-y-1.5">
          {/* My Budget option */}
          <button
            onClick={() => {
              onSwitch(null)
              onClose()
            }}
            className={cn(
              'w-full text-left px-2 py-1.5 rounded-lg transition flex items-center gap-2',
              isMyBudget ? 'bg-white shadow-sm' : 'hover:bg-white/70'
            )}
          >
            <span className="text-base">👤</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-pink-950 truncate">
                {myNickname || 'My Budget'}
              </p>
              <p className="text-[9px] text-pink-700/60 truncate">{myEmail}</p>
            </div>
            {isMyBudget && <span className="text-pink-500 text-sm">✓</span>}
          </button>

          {/* Shareable users */}
          {shareableUsers.map((user) => {
            const isActive = activeUserId === user.user_id
            return (
              <button
                key={user.user_id}
                onClick={() => {
                  onSwitch(user.user_id)
                  onClose()
                }}
                className={cn(
                  'w-full text-left px-2 py-1.5 rounded-lg transition flex items-center gap-2',
                  isActive ? 'bg-white shadow-sm' : 'hover:bg-white/70'
                )}
              >
                <span className="text-base">📊</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-pink-950 truncate">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-[9px] text-pink-700/60 truncate">
                    {user.email}
                  </p>
                </div>
                {isActive && <span className="text-pink-500 text-sm">✓</span>}
              </button>
            )
          })}
        </div>

        {/* Footer hint */}
        <p className="text-[10px] text-pink-700/80 font-medium mb-4">
          💡 Premium feature — Shared Household Budget
        </p>

        {/* Tutup button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition"
        >
          Tutup
        </button>
      </div>
    </div>,
    document.body
  )
}
