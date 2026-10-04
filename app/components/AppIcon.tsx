import { BRAND } from '@/lib/brand-icons'
import type { Card } from '../lib/catalog'

// Logo do app (marca, ícone do Hydra ou ícone genérico)
export default function AppIcon({ card, size = 40 }: { card: Card; size?: number }) {
  if (card.brand && BRAND[card.brand]) {
    return <svg viewBox="0 0 24 24" width={size} height={size} fill={card.fg || '#fff'} aria-hidden="true"><path d={BRAND[card.brand]} /></svg>
  }
  if (card.icon === 'hydra') return <img src="/hydra-icon.png" alt="" width={size} height={size} />
  const Icon = card.icon
  return <Icon width={size} height={size} strokeWidth={1.5} aria-hidden="true" />
}
