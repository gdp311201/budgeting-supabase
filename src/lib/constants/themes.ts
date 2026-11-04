/**
 * Theme presets — match the 8 themes we discussed
 * Customer can pick one of these OR fully customize their own
 */

export interface ThemePreset {
  name: string
  label: string
  icon: string
  palette: {
    primary: string
    accent: string
    gradient: [string, string, string]
  }
  wallpaper: string
  description: string
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'elephant',
    label: '🐘 Elephant Pink',
    icon: '🐘',
    palette: {
      primary: '#ec4899',
      accent: '#f43f5e',
      gradient: ['#8a96a8', '#ba9eb1', '#e3b9ca'],
    },
    wallpaper: 'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
    description: 'Cute & feminine (default theme)',
  },
  {
    name: 'cat',
    label: '🐱 Cat Mocha',
    icon: '🐱',
    palette: {
      primary: '#b8856c',
      accent: '#8b6f4e',
      gradient: ['#c9a78a', '#a68465', '#8b6f4e'],
    },
    wallpaper: 'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
    description: 'Cozy warm vibes',
  },
  {
    name: 'butterfly',
    label: '🦋 Butterfly Ocean',
    icon: '🦋',
    palette: {
      primary: '#0ea5e9',
      accent: '#06b6d4',
      gradient: ['#7dd3fc', '#38bdf8', '#0ea5e9'],
    },
    wallpaper: 'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
    description: 'Calm fresh ocean feel',
  },
  {
    name: 'wave',
    label: '🌊 Wave Sunset',
    icon: '🌊',
    palette: {
      primary: '#f97316',
      accent: '#ec4899',
      gradient: ['#fbbf24', '#f97316', '#ec4899'],
    },
    wallpaper: 'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
    description: 'Vibrant energetic sunset',
  },
  {
    name: 'forest',
    label: '🌿 Forest Sage',
    icon: '🌿',
    palette: {
      primary: '#10b981',
      accent: '#059669',
      gradient: ['#86efac', '#4ade80', '#22c55e'],
    },
    wallpaper: 'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
    description: 'Natural zen minimal',
  },
  {
    name: 'moon',
    label: '🌙 Moon Lavender',
    icon: '🌙',
    palette: {
      primary: '#a78bfa',
      accent: '#8b5cf6',
      gradient: ['#ddd6fe', '#a78bfa', '#7c3aed'],
    },
    wallpaper: 'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
    description: 'Dreamy minimal lavender',
  },
  {
    name: 'sakura',
    label: '🌸 Sakura Dream',
    icon: '🌸',
    palette: {
      primary: '#fbcfe8',
      accent: '#f9a8d4',
      gradient: ['#fce7f3', '#fbcfe8', '#f9a8d4'],
    },
    wallpaper: 'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
    description: 'Soft pastel sakura',
  },
  {
    name: 'star',
    label: '⭐ Star Gold',
    icon: '⭐',
    palette: {
      primary: '#fbbf24',
      accent: '#d97706',
      gradient: ['#fef3c7', '#fbbf24', '#d97706'],
    },
    wallpaper: 'https://i.ibb.co/3XcMMzX/wp8104164.jpg',
    description: 'Luxe premium gold',
  },
]

export function getThemeByName(name: string): ThemePreset | undefined {
  return THEME_PRESETS.find((t) => t.name === name)
}

export const DEFAULT_THEME = THEME_PRESETS[0] // elephant
