import type { MetadataRoute } from 'next'

/**
 * PWA Manifest — makes app installable on Android/iOS home screen
 * Replace icons with real PNG icons (192x192 and 512x512) when ready
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Budgeting Master Sync',
    short_name: 'Budgeting',
    description:
      'Personal budgeting app with beautiful themes & smart tracking',
    start_url: '/',
    display: 'standalone',
    background_color: '#d8b0c0',
    theme_color: '#ec4899',
    orientation: 'portrait',
    categories: ['finance', 'productivity', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
