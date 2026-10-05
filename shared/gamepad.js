// Controle de PS4 (Gamepad API): botões, direção e navegação espacial entre elementos.
// Usado pelo menu (tela) e pelo preload dos sites de streaming.

// Mapeamento "standard" do navegador para o DualShock 4
const BTN = { X: 0, O: 1, SQUARE: 2, TRIANGLE: 3, L1: 4, R1: 5, L2: 6, R2: 7, OPTIONS: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15, PS: 16 }
const DEAD_ZONE = 0.6

// Detecta o instante do aperto. Todos os botões são lidos a cada quadro (antes, um
// `a() || b()` deixava de atualizar o segundo botão e ele disparava de novo depois).
function createEdges() {
  const held = []
  return function update(pad) {
    const fired = new Set()
    const buttons = (pad && pad.buttons) || []
    for (let i = 0; i < buttons.length; i++) {
      const pressed = !!(buttons[i] && buttons[i].pressed)
      if (pressed && !held[i]) fired.add(i)
      held[i] = pressed
    }
    return (i) => fired.has(i)
  }
}

const isDown = (pad, i) => !!(pad.buttons[i] && pad.buttons[i].pressed)

// D-pad ou analógico esquerdo → { dx, dy } com valores -1, 0 ou 1
function direction(pad) {
  const x = pad.axes[0] || 0
  const y = pad.axes[1] || 0
  const dx = isDown(pad, BTN.RIGHT) || x > DEAD_ZONE ? 1 : isDown(pad, BTN.LEFT) || x < -DEAD_ZONE ? -1 : 0
  const dy = isDown(pad, BTN.DOWN) || y > DEAD_ZONE ? 1 : isDown(pad, BTN.UP) || y < -DEAD_ZONE ? -1 : 0
  return { dx, dy }
}

// Separados: no perfil PC do DS4Windows o analógico vira mouse, e aí ele não pode navegar
function dpadDirection(pad) {
  const dx = isDown(pad, BTN.RIGHT) ? 1 : isDown(pad, BTN.LEFT) ? -1 : 0
  const dy = isDown(pad, BTN.DOWN) ? 1 : isDown(pad, BTN.UP) ? -1 : 0
  return { dx, dy }
}
function stickDirection(pad) {
  const x = pad.axes[0] || 0
  const y = pad.axes[1] || 0
  return { dx: x > DEAD_ZONE ? 1 : x < -DEAD_ZONE ? -1 : 0, dy: y > DEAD_ZONE ? 1 : y < -DEAD_ZONE ? -1 : 0 }
}
const anyButton = (pad) => (pad.buttons || []).some((b) => b && b.pressed)

// Próximo elemento na direção pedida (índice em rects). Pesa mais o desvio lateral,
// para preferir o que está alinhado. Sem nada na direção, fica onde está.
function pickNext(rects, current, dx, dy) {
  if (current < 0 || current >= rects.length) return rects.length ? 0 : -1
  const center = (r) => [r.left + r.width / 2, r.top + r.height / 2]
  const [ax, ay] = center(rects[current])
  let best = current
  let bestCost = Infinity
  rects.forEach((r, i) => {
    if (i === current) return
    const [bx, by] = center(r)
    const ox = bx - ax
    const oy = by - ay
    const along = dx ? ox * dx : oy * dy
    if (along <= 4) return
    const cost = along + (dx ? Math.abs(oy) : Math.abs(ox)) * 2.5
    if (cost < bestCost) { bestCost = cost; best = i }
  })
  return best
}

module.exports = { BTN, createEdges, direction, dpadDirection, stickDirection, anyButton, pickNext }
