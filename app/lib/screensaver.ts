// Proteção de tela: quando o app fica parado, mostra imagens de filmes e séries em alta.
export const SAVER_OPTIONS = [0, 5, 10, 15, 30] // minutos; 0 = desligada
const MINUTE = 60_000
const DEAD_ZONE = 0.5

export function createIdle(now: () => number = Date.now) {
  let last = now()
  return {
    touch: () => { last = now() },
    isIdle: (minutes: number) => minutes > 0 && now() - last >= minutes * MINUTE,
  }
}

export function slidesFrom(items: { title: string; backdrop?: string }[]) {
  const seen = new Set<string>()
  const out: { title: string; image: string }[] = []
  for (const it of items) {
    if (!it.backdrop || seen.has(it.backdrop)) continue
    seen.add(it.backdrop)
    out.push({ title: it.title, image: it.backdrop })
  }
  return out
}

export const nextMinutes = (m: number) => SAVER_OPTIONS[(SAVER_OPTIONS.indexOf(m) + 1) % SAVER_OPTIONS.length]

type PadLike = { buttons: readonly { pressed: boolean }[]; axes: readonly number[] }
export const padActive = (pad: PadLike) =>
  pad.buttons.some((b) => b && b.pressed) || pad.axes.some((a) => Math.abs(a) > DEAD_ZONE)
