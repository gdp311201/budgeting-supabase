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
 * Account Switcher — dropdown button in header.
 * Allows premium+ users to switch between "My Budget" and shared partner's budget.
 *
 * Behavior:
 * - Click button → dropdown opens
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

  // Determine current label
  const isMyBudget = activeUserId === null
  const currentUser = isMyBudget
    ? { email: myEmail, full_name: myNickname, tier: 'me' as const }
    : shareableUsers.find((u) => u.user_id === activeUserId)

  const currentLabel = isMyBudget
    ? (myNickname || 'My Budget')
    : (currentUser?.full_name || currentUser?.email || 'Shared')

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition',
          'bg-white/70 backdrop-blur-md border border-pink-200/60 shadow-sm',
          'hover:bg-white/90 hover:shadow-md',
          open && 'bg-white/95 shadow-md'
        )}
        aria-label="Switch account"
        aria-expanded={open}
      >
        <span className="text-sm">
          {isMyBudget ? '👤' : '📊'}
        </span>
        <span className="max-w-[80px] truncate text-pink-900">
          {currentLabel}
        </span>
        <span className={cn('text-pink-400 transition-transform', open && 'rotate-180')}>
          ▼
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white/95 backdrop-blur-xl border border-pink-200/60 rounded-2xl shadow-2xl z-50 overflow-hidden">
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
          {shareableUsers.length > 0 && (
            <div className="border-t border-pink-100" />
          )}

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
