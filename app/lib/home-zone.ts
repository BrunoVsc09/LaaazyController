// No menu, o controle anda entre duas fileiras: os ícones do cabeçalho e os cards.
export type Zone = 'tiles' | 'header'

export function nextZone(zone: Zone, dy: number): Zone {
  if (zone === 'tiles' && dy < 0) return 'header'
  if (zone === 'header' && dy > 0) return 'tiles'
  return zone
}
