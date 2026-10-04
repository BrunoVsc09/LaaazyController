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
