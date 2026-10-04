// Roda dentro de Netflix, Prime, HBO, etc. Traduz o controle de PS4 em navegação.
const { ipcRenderer } = require('electron')

const SEL = 'a[href],button,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"]),input'
const held = {}
let lastMove = 0

function visible(el) {
  const r = el.getBoundingClientRect()
  return r.width > 8 && r.height > 8 && r.bottom > 0 && r.right > 0 &&
    r.top < innerHeight && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden'
}

function move(dx, dy) {
  const els = [...document.querySelectorAll(SEL)].filter(visible)
  const cur = document.activeElement
  if (!cur || !els.includes(cur)) { if (els[0]) els[0].focus(); return }
  const a = cur.getBoundingClientRect()
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2
  let best = null, bestD = Infinity
  for (const el of els) {
    if (el === cur) continue
    const b = el.getBoundingClientRect()
    const ox = b.left + b.width / 2 - ax, oy = b.top + b.height / 2 - ay
    const along = dx ? ox * dx : oy * dy
    if (along <= 4) continue
    const across = dx ? Math.abs(oy) : Math.abs(ox)
    const d = along + across * 2.5
    if (d < bestD) { bestD = d; best = el }
  }
  if (best) {
    best.focus({ preventScroll: true })
    best.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
  }
}

function edge(pad, i) {
  const p = !!(pad.buttons[i] && pad.buttons[i].pressed)
  const fire = p && !held[i]
  held[i] = p
  return fire
}

function tick() {
  const pad = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).find(Boolean)
  if (pad) {
    const x = pad.axes[0] || 0, y = pad.axes[1] || 0
    const dx = (pad.buttons[15]?.pressed || x > 0.6) ? 1 : (pad.buttons[14]?.pressed || x < -0.6) ? -1 : 0
    const dy = (pad.buttons[13]?.pressed || y > 0.6) ? 1 : (pad.buttons[12]?.pressed || y < -0.6) ? -1 : 0
    const now = performance.now()
    if ((dx || dy) && now - lastMove > 240) { move(dx, dy); lastMove = now }
    if (!dx && !dy) lastMove = 0

    const ry = pad.axes[3] || 0
    if (Math.abs(ry) > 0.3) window.scrollBy(0, ry * 30)

    if (edge(pad, 0)) document.activeElement && document.activeElement.click() // X = confirmar
    if (edge(pad, 1)) ipcRenderer.send('back')                                  // O = voltar
    if (edge(pad, 3)) ipcRenderer.send('key', 'Space')                          // triângulo = play/pausa
    if (edge(pad, 4)) ipcRenderer.send('key', 'Left')                           // L1 = -10s
    if (edge(pad, 5)) ipcRenderer.send('key', 'Right')                          // R1 = +10s
    if (edge(pad, 9) || edge(pad, 16)) ipcRenderer.send('home')                 // Options / PS = menu
  }
  requestAnimationFrame(tick)
}

window.addEventListener('DOMContentLoaded', () => {
  const s = document.createElement('style')
  s.textContent = '*:focus{outline:4px solid #ffd23f !important;outline-offset:3px !important} *,*::before,*::after{cursor:none !important}'
  document.head.appendChild(s)
})
requestAnimationFrame(tick)
