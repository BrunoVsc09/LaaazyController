import gamepad from '../../shared/gamepad'

// Move o foco entre os elementos de `selector` pelo D-pad/analógico
export function focusMove(selector: string, dx: number, dy: number) {
  const strip = rowScope(document.activeElement as HTMLElement | null, dx) as HTMLElement | null
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && (!strip || strip.contains(el))
  })
  const i = gamepad.pickNext(els.map((e) => e.getBoundingClientRect()), els.indexOf(document.activeElement as HTMLElement), dx, dy)
  const next = els[i]
  if (!next || next === document.activeElement) return
  next.focus()
  // Subindo/descendo no Início, a fileira para sempre logo abaixo do destaque (scroll-padding-top)
  const row = rowAnchor(next, dy) as HTMLElement | null
  if (row) row.scrollIntoView({ block: 'start' })
  else next.scrollIntoView({ block: 'nearest' })
}

// Cursor do analógico (perfil PC do Laaazy-pad): o foco acompanha o cursor, senão a borda
// fica num item e o cursor em outro, e parece que a seleção sumiu.
type ElLike = { tagName: string; closest: (sel: string) => ElLike | null }
const PRESSABLE = 'button, input, textarea, select, a, label, iframe, [tabindex]'

export function hoverTarget(target: ElLike | null, active: ElLike | null, selector: string): ElLike | null {
  const el = target?.closest(selector) ?? null
  if (!el || el === active) return null
  if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return null
  return el
}

// Andando para os lados num card de fileira: só a mesma fileira (no fim dela a borda para, em vez de
// pular para outra fileira). Para cima/baixo, ou fora de fileira: null = a tela toda
export const rowScope = (active: ElLike | null, dx: number) => (dx ? active?.closest('.lz-strip') ?? null : null)

// Subindo/descendo para um card de fileira do Início: a fileira inteira (com o título) é o que rola
// até ficar logo abaixo do destaque. Para os lados ou fora do Início: null (rola só o necessário)
export const rowAnchor = (next: ElLike | null, dy: number) => (dy ? next?.closest('.lz-home .lz-row') ?? null : null)

// Clique no fundo da tela tiraria o foco (e a borda) de tudo: nesse caso o clique não mexe no foco
export const keepsFocusOnPress = (target: ElLike | null) => !target?.closest(PRESSABLE)

// Fileiras do Início com o mouse: setas ‹ › que andam quase uma tela (85%: sobra um card visível)
type Strip = { left: number; width: number; total: number }
const STRIP_STEP = 0.85
export function stripTarget({ left, width, total }: Strip, dir: 1 | -1) {
  return Math.min(Math.max(left + dir * width * STRIP_STEP, 0), Math.max(total - width, 0))
}
// Qual seta aparece (2 px de folga: o navegador arredonda a rolagem)
export function stripEnds({ left, width, total }: Strip) {
  return { prev: left > 2, next: left + width < total - 2 }
}

// Botão "voltar" do mouse (o de lado, nº 3) faz o mesmo que o ○
export const isMouseBack = (button: number) => button === 3

// Teclado por cima: sem uma tecla selecionada não aparece a borda e o D-pad não tem de onde partir
export const needsKeyFocus = (active: ElLike | null, keys: string) => !active?.closest(keys)
