'use client'

import { useState } from 'react'
import type { ShareableUser } from '@/lib/api/subscription'
import { cn } from '@/lib/utils/format'

interface Props {
  /** Currently active user ID (null = my own data) */
  activeUserId: string | null
  /** List of users I can switch to (from getShareableUsers()) */
  shareableUsers: ShareableUser[]
  /** My own info (for the "My Budget" option) */
  myEmail: string
  myNickname: string | null
  /** Callback when user selects a different account */
  onSwitch: (userId: string | null) => void
}

/**
 * AccountSwitcher — circular icon button in header pill
 *
 * Sprint 3A Redesign + Fix:
 * - Small circular icon button (24x24px) inside header pill
 * - Click → CENTER POPUP MODAL (not dropdown) — like DeleteConfirmModal
 * - Backdrop blur, center card, click outside to close
 * - Hidden entirely if no shareable users (basic tier users see nothing)
 */
export default function AccountSwitcher({
  activeUserId,
  shareableUsers,
  myEmail,
  myNickname,
  onSwitch,
}: Props) {
  const [open, setOpen] = useState(false)

  // If no shareable users (user is basic tier, or no partner shared), don't render
  if (shareableUsers.length === 0) {
    return null
  }

  // Determine current icon
  const isMyBudget = activeUserId === null
  const currentIcon = isMyBudget ? '👤' : '📊'

  return (
    <>
      {/* Circular icon button — fits inside header pill */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition shrink-0',
          'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-sm',
          'hover:scale-110 active:scale-95'
        )}
        aria-label="Switch account"
        title={isMyBudget ? 'My Budget' : 'Viewing shared data'}
      >
        {currentIcon}
      </button>

      {/* ===== CENTER POPUP MODAL (like DeleteConfirmModal) ===== */}
      {open && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-pink-950/60 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-xs w-full overflow-hidden animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-pink-200/60 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">Switch Account</h3>
                <p className="text-[10px] text-white/80">Pilih akun untuk lihat datanya</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/25 border border-white/40 text-white font-bold flex items-center justify-center hover:bg-white/40 transition"
              >
                ✕
              </button>
            </div>

            {/* Account options */}
            <div className="px-4 py-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {/* My Budget option */}
              <button
                onClick={() => {
                  onSwitch(null)
                  setOpen(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl transition flex items-center gap-2 border',
                  isMyBudget
                    ? 'bg-pink-100 border-pink-300'
                    : 'bg-white/60 border-pink-200 hover:bg-pink-50'
                )}
              >
                <span className="text-xl">👤</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-pink-950 truncate">
                    {myNickname || 'My Budget'}
                  </p>
                  <p className="text-[10px] text-pink-700/60 truncate">{myEmail}</p>
                </div>
                {isMyBudget && <span className="text-pink-500 text-base">✓</span>}
              </button>

              {/* Shareable users */}
              {shareableUsers.map((user) => {
                const isActive = activeUserId === user.user_id
                return (
                  <button
                    key={user.user_id}
                    onClick={() => {
                      onSwitch(user.user_id)
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-xl transition flex items-center gap-2 border',
                      isActive
                        ? 'bg-pink-100 border-pink-300'
                        : 'bg-white/60 border-pink-200 hover:bg-pink-50'
                    )}
                  >
                    <span className="text-xl">📊</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-pink-950 truncate">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-[10px] text-pink-700/60 truncate">
                        {user.email}
                      </p>
                    </div>
                    {isActive && <span className="text-pink-500 text-base">✓</span>}
                  </button>
                )
              })}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 bg-pink-50/50 border-t border-pink-100">
              <p className="text-[9px] text-pink-700/60 italic text-center">
                💡 Premium feature — Shared Household Budget
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
