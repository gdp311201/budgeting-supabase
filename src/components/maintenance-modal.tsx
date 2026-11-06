'use client'

import { useEffect, useState } from 'react'
import { getMaintenanceMode } from '@/lib/api/subscription'
import { useTier } from '@/lib/hooks/use-tier'

interface MaintenanceConfig {
  enabled: boolean
  message: string
  started_at: string | null
  expected_completion_hours: number | null
  allow_admin_access: boolean
}

/**
 * MaintenanceModal — full-screen modal when maintenance_mode is ON
 *
 * Behavior:
 * - Polls /api/admin/maintenance (via subscription.getSystemSetting) every 60s
 * - When enabled: show full-screen modal blocking all app access
 * - Exception: admins (is_admin = true) can still access app (allow_admin_access = true)
 * - Shows custom message + expected completion time
 *
 * Used in: budgeting-app.tsx (rendered at root level)
 */
export default function MaintenanceModal() {
  const { isAdmin } = useTier()
  const [config, setConfig] = useState<MaintenanceConfig | null>(null)
  const [loading, setLoading] = useState(true)

  // Poll maintenance status every 60 seconds
  useEffect(() => {
    let cancelled = false

    async function checkMaintenance() {
      try {
        const cfg = await getMaintenanceMode()
        if (!cancelled) {
          setConfig(cfg)
        }
      } catch (err) {
        console.error('Failed to fetch maintenance mode:', err)
        // Don't show modal if fetch fails (avoid false-positive blocking)
        if (!cancelled) {
          setConfig({
            enabled: false,
            message: '',
            started_at: null,
            expected_completion_hours: null,
            allow_admin_access: true,
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkMaintenance()
    const interval = setInterval(checkMaintenance, 60_000) // poll every 60s

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Loading or no config yet — don't block
  if (loading || !config) return null

  // Maintenance OFF — don't render
  if (!config.enabled) return null

  // Maintenance ON but admin can access — don't render (admin sees normal app)
  if (config.allow_admin_access && isAdmin) return null

  // Maintenance ON, user is non-admin (or admin_access disabled) → show modal
  const waLink =
    'https://wa.me/62XXXXXXXXXXX?text=Halo%20Julyo%2C%20kapan%20app%20budgeting%20bisa%20diakses%20lagi%3F'

  // Calculate started time ago
  let startedAgo = ''
  if (config.started_at) {
    const elapsed = Date.now() - new Date(config.started_at).getTime()
    const hours = Math.floor(elapsed / (60 * 60 * 1000))
    const minutes = Math.floor((elapsed % (60 * 60 * 1000)) / (60 * 1000))
    if (hours > 0) {
      startedAgo = `${hours}h ${minutes}m ago`
    } else {
      startedAgo = `${minutes}m ago`
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gradient-to-br from-pink-900 via-rose-900 to-pink-950">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
        {/* Animated icon */}
        <div className="text-7xl mb-4 animate-bounce">🔧</div>

        {/* Title */}
        <h2 className="text-xl font-black text-pink-950 mb-2 tracking-wide">
          Maintenance in Progress
        </h2>
        <p className="text-xs font-bold uppercase tracking-widest text-pink-600 mb-4">
          We'll be right back
        </p>

        {/* Custom message from admin */}
        {config.message && (
          <div className="bg-pink-50 border border-pink-200 rounded-2xl p-3 mb-4">
            <p className="text-xs text-pink-900 leading-relaxed italic">
              &ldquo;{config.message}&rdquo;
            </p>
          </div>
        )}

        {/* Time info */}
        <div className="space-y-1.5 text-xs text-pink-800/80 mb-5">
          {startedAgo && (
            <p>
              <span className="font-semibold">⏱️ Started:</span> {startedAgo}
            </p>
          )}
          {config.expected_completion_hours && (
            <p>
              <span className="font-semibold">⌛ Expected duration:</span>{' '}
              {config.expected_completion_hours} hour
              {config.expected_completion_hours > 1 ? 's' : ''}
            </p>
          )}
          <p className="text-[10px] text-pink-700/60 italic">
            App auto-refreshes every minute — you'll be redirected when ready.
          </p>
        </div>

        {/* WhatsApp contact */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow-md"
        >
          💬 Need help? WhatsApp us
        </a>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="mt-2 w-full text-pink-700/60 hover:text-pink-900 text-xs font-medium py-1"
        >
          ↻ Try again
        </button>
      </div>
    </div>
  )
}
