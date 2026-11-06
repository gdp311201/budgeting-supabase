'use client'

import { useEffect, useState } from 'react'
import AdminPanel from '@/components/admin-panel'

interface Props {
  adminEmail: string
  adminName: string
}

export default function AdminPanelWrapper({ adminEmail, adminName }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid hydration mismatch — render after mount
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-3" />
          <p className="text-xs text-slate-400 font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return <AdminPanel adminEmail={adminEmail} adminName={adminName} />
}
