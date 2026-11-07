'use client'

import { useState, useRef, useEffect } from 'react'
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
 * Sprint 3A Redesign:
 * - Changed from pill-shaped button with text → small circular icon button (24x24)
 * - Positioned INSIDE header pill, next to "My Budgeting" text (1 baris)
 * - Dropdown opens below with list of accounts
 * - Hidden entirely if no shareable users (basic tier users see nothing)
 *
 * Behavior:
 * - Click button → dropdown opens below
 * - Select "My Budget" → onSwitch(null)
 * - Select partner → onSwitch(partnerUserId)
 * - Click outside → dropdown closes
 */
export default function AccountSwitcher({
  activeUserId,
  shareableUsers,
  myEmail,
  myNickname,
  onSwitch,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // If no shareable users (user is basic tier, or no partner shared), don't render
  if (shareableUsers.length === 0) {
    return null
  }

  // Determine current icon
  const isMyBudget = activeUserId === null
  const currentIcon = isMyBudget ? '👤' : '📊'

  return (
    <div ref={ref} className="relative">
      {/* Circular icon button — fits inside header pill */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition shrink-0',
          'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-sm',
          'hover:scale-110 active:scale-95',
          open && 'ring-2 ring-pink-200'
        )}
        aria-label="Switch account"
        aria-expanded={open}
        title={isMyBudget ? 'My Budget' : 'Viewing shared data'}
      >
        {currentIcon}
      </button>

      {/* Dropdown — opens BELOW the button */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-pink-200/60 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 bg-pink-50/80 border-b border-pink-100">
            <p className="text-[10px] uppercase tracking-wider font-bold text-pink-700">
              Switch Account
            </p>
          </div>

          {/* My Budget option */}
          <button
            onClick={() => {
              onSwitch(null)
              setOpen(false)
            }}
            className={cn(
              'w-full text-left px-3 py-2.5 hover:bg-pink-50/70 transition flex items-center gap-2',
              isMyBudget && 'bg-pink-100/70'
            )}
          >
            <span className="text-base">👤</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-pink-950 truncate">
                {myNickname || 'My Budget'}
              </p>
              <p className="text-[10px] text-pink-700/60 truncate">{myEmail}</p>
            </div>
            {isMyBudget && <span className="text-pink-500 text-xs">✓</span>}
          </button>

          {/* Divider */}
          <div className="border-t border-pink-100" />

          {/* Shareable users list */}
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
                  'w-full text-left px-3 py-2.5 hover:bg-pink-50/70 transition flex items-center gap-2',
                  isActive && 'bg-pink-100/70'
                )}
              >
                <span className="text-base">📊</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-pink-950 truncate">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-[10px] text-pink-700/60 truncate">
                    {user.email}
                  </p>
                </div>
                {isActive && <span className="text-pink-500 text-xs">✓</span>}
              </button>
            )
          })}

          {/* Footer hint */}
          <div className="px-3 py-2 bg-pink-50/50 border-t border-pink-100">
            <p className="text-[9px] text-pink-700/60 italic">
              💡 Premium feature — Shared Household Budget
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
