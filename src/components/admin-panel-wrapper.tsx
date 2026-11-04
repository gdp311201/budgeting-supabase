'use client'

import { useEffect, useState } from 'react'
import AdminPanel from '@/components/admin-panel'

export default function AdminPanelWrapper() {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!open) {
      window.location.href = '/'
    }
  }, [open])

  if (!open) return null
  return <AdminPanel onClose={() => setOpen(false)} />
}
