// Segurando a direção (D-pad ou analógico): o 1º passo é na hora; o 2º espera mais (um toque anda
// um card só); depois acelera para atravessar fileiras longas sem demora
const FIRST = 260
const NEXT = 140
const FAST = 85
const FAST_AFTER = 4 // a partir do 4º passo seguido

// steps = quantos passos já foram dados nesta segurada (>= 1)
export const repeatDelay = (steps: number) => (steps <= 1 ? FIRST : steps < FAST_AFTER ? NEXT : FAST)
