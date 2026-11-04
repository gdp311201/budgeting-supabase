'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/format'

export interface Tab {
  id: string
  label: string
  icon: React.ReactNode
}

interface Props {
  tabs: string[]
  activeTab: string
  onChange: (tab: any) => void
}

const TAB_ICONS: Record<string, { label: string; svg: React.ReactNode }> = {
  input: {
    label: 'Input',
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  mutasi: {
    label: 'Mutasi',
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  dashboard: {
    label: 'Dashboard',
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  receipt: {
    label: 'Receipt',
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  search: {
    label: 'Cari',
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
}

export default function BottomNav({ tabs, activeTab, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md"
      aria-label="Navigasi utama"
    >
      <div className="bg-white/60 backdrop-blur-md border border-white/70 rounded-3xl px-3 py-2 shadow-xl">
        <div className="flex items-center justify-around gap-1">
          {tabs.map((tabId) => {
            const icon = TAB_ICONS[tabId]
            if (!icon) return null
            const isActive = activeTab === tabId
            return (
              <button
                key={tabId}
                onClick={() => onChange(tabId)}
                className={cn(
                  'flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all',
                  isActive ? 'bg-pink-500 text-white shadow-md scale-105' : 'text-pink-900/60 hover:text-pink-950'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {icon.svg}
                <span className="text-[10px] font-semibold">{icon.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
