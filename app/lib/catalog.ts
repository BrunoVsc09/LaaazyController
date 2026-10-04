// Cards do menu.
import { BookOpen, Gamepad2, MonitorPlay, Music2, Video, type LucideIcon } from 'lucide-react'
import streaming from '../../shared/streaming'

export type Card = {
  label: string
  icon: LucideIcon | 'hydra'
  kind: 'utility' | 'games'
  brand?: string
  bg?: string
  fg?: string
  url?: string                 // abre como site (app ou Edge, decidido no Electron)
  app?: string                 // programa do PC (exe-locator)
  screen?: 'library' | 'ds4'   // abre uma tela do próprio app
}

const urlOf = (label: string) => streaming.find((s) => s.label === label)?.url

export const CATALOG: Card[] = [
  { label: 'Loja Hydra', app: 'hydra', icon: 'hydra', kind: 'utility' },
  { label: 'Biblioteca', screen: 'library', icon: BookOpen, kind: 'games' },
  { label: 'Crunchyroll', brand: 'crunchyroll', bg: '#F47521', url: urlOf('Crunchyroll'), icon: Video, kind: 'utility' },
  { label: 'HBO Max', brand: 'hbomax', bg: '#4B1FA8', url: urlOf('HBO Max'), icon: MonitorPlay, kind: 'utility' },
  { label: 'Prime Video', bg: '#00A8E1', url: urlOf('Prime Video'), icon: Video, kind: 'utility' },
  { label: 'Netflix', brand: 'netflix', bg: '#141414', fg: '#E50914', url: urlOf('Netflix'), icon: MonitorPlay, kind: 'utility' },
  { label: 'YouTube', brand: 'youtube', bg: '#FF0000', url: urlOf('YouTube'), icon: Video, kind: 'utility' },
  { label: 'Spotify', brand: 'spotify', bg: '#1ED760', fg: '#000', url: urlOf('Spotify'), icon: Music2, kind: 'utility' },
  { label: 'Google Chrome', app: 'chrome', brand: 'chrome', bg: '#1A73E8', icon: MonitorPlay, kind: 'utility' },
  { label: 'Firefox', app: 'firefox', brand: 'firefox', bg: '#E66000', icon: MonitorPlay, kind: 'utility' },
  { label: 'DS4Windows', screen: 'ds4', icon: Gamepad2, kind: 'utility' },
]
