'use client'

import { useEffect } from 'react'

/**
 * PWA Loading Screen — tampil sebelum React hydrate
 * Auto-hide setelah app ready
 */
export default function PwaLoadingScreen() {
  useEffect(() => {
    // Hide loading screen once React hydrates
    const el = document.getElementById('pwa-loading')
    if (el) {
      const timer = setTimeout(() => {
        el.style.opacity = '0'
        setTimeout(() => {
          el.style.display = 'none'
        }, 300)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  return null
}
