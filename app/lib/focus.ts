import gamepad from '../../shared/gamepad'

// Move o foco entre os elementos de `selector` pelo D-pad/analógico
export function focusMove(selector: string, dx: number, dy: number) {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  })
  const i = gamepad.pickNext(els.map((e) => e.getBoundingClientRect()), els.indexOf(document.activeElement as HTMLElement), dx, dy)
  const next = els[i]
  if (!next || next === document.activeElement) return
  next.focus()
  next.scrollIntoView({ block: 'nearest' })
}

// Cursor do analógico (perfil PC do DS4Windows): o foco acompanha o cursor, senão a borda
// fica num item e o cursor em outro, e parece que a seleção sumiu.
type ElLike = { tagName: string; closest: (sel: string) => ElLike | null }
const PRESSABLE = 'button, input, textarea, select, a, label, iframe, [tabindex]'

export function hoverTarget(target: ElLike | null, active: ElLike | null, selector: string): ElLike | null {
  const el = target?.closest(selector) ?? null
  if (!el || el === active) return null
  if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return null
  return el
}

// Clique no fundo da tela tiraria o foco (e a borda) de tudo: nesse caso o clique não mexe no foco
export const keepsFocusOnPress = (target: ElLike | null) => !target?.closest(PRESSABLE)
