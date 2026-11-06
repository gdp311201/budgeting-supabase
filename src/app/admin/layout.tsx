import type { Metadata } from 'next'
import './globals-admin.css'

export const metadata: Metadata = {
  title: 'GDP Admin — Budgeting Master Sync',
  description: 'Admin control panel for GDP Budgeting',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
