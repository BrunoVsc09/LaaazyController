// Segurando a direção (D-pad ou analógico): o 1º passo é na hora; o 2º espera mais (um toque anda
// um card só); depois acelera para atravessar fileiras longas sem demora
const FIRST = 330
const NEXT = 170
const FAST = 110
const FAST_AFTER = 5 // a partir do 5º passo seguido

// steps = quantos passos já foram dados nesta segurada (>= 1)
export const repeatDelay = (steps: number) => (steps <= 1 ? FIRST : steps < FAST_AFTER ? NEXT : FAST)
