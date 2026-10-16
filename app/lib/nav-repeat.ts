// Segurando a direção (D-pad ou analógico): o 1º passo é na hora; o 2º espera mais (um toque anda
// um card só); depois acelera para atravessar fileiras longas sem demora
const FIRST = 260
const NEXT = 140
const FAST = 85
const FAST_AFTER = 4 // a partir do 4º passo seguido

// steps = quantos passos já foram dados nesta segurada (>= 1)
export const repeatDelay = (steps: number) => (steps <= 1 ? FIRST : steps < FAST_AFTER ? NEXT : FAST)

// Segurada atual: direção ('dx,dy' ou '' solta), passos dados e quando foi o último
export type Hold = { dir: string; steps: number; at: number }
const RELEASED: Hold = { dir: '', steps: 0, at: 0 }

// Dá um passo agora? Direção nova anda na hora; segurando, espera o repeatDelay
export function holdStep(hold: Hold, dir: string, now: number): { step: boolean; hold: Hold } {
  if (!dir) return { step: false, hold: RELEASED }
  const cur = hold.dir === dir ? hold : { ...RELEASED, dir }
  if (cur.steps > 0 && now - cur.at < repeatDelay(cur.steps)) return { step: false, hold: cur }
  return { step: true, hold: { dir, steps: cur.steps + 1, at: now } }
}
