// Roda dentro de Netflix, Prime, HBO etc. Traduz o controle de PS4 em navegação.
// Fonte: scripts/build-preloads.js gera electron/stream-preload.js com shared/ embutido.
const { ipcRenderer } = require('electron')
const C = require('../shared/channels')
const { BTN, createEdges, direction, pickNext } = require('../shared/gamepad')

const SELECTABLE = 'a[href],button,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"]),input'
const REPEAT_MS = 240

function visible(el) {
  const r = el.getBoundingClientRect()
  return r.width > 8 && r.height > 8 && r.bottom > 0 && r.right > 0 &&
    r.top < innerHeight && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden'
}

function move(dx, dy) {
  const els = [...document.querySelectorAll(SELECTABLE)].filter(visible)
  const next = els[pickNext(els.map((e) => e.getBoundingClientRect()), els.indexOf(document.activeElement), dx, dy)]
  if (!next || next === document.activeElement) return
  next.focus({ preventScroll: true })
  next.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
}

const edges = createEdges()
let lastMove = 0

function tick() {
  const pad = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).find(Boolean)
  if (pad) {
    const { dx, dy } = direction(pad)
    const now = performance.now()
    if ((dx || dy) && now - lastMove > REPEAT_MS) { move(dx, dy); lastMove = now }
    if (!dx && !dy) lastMove = 0

    const ry = pad.axes[3] || 0
    if (Math.abs(ry) > 0.3) window.scrollBy(0, ry * 30) // analógico direito rola a página

    const fired = edges(pad)
    if (fired(BTN.X) && document.activeElement) document.activeElement.click()
    if (fired(BTN.O)) ipcRenderer.send(C.BACK)
    if (fired(BTN.TRIANGLE)) ipcRenderer.send(C.KEY, 'Space') // play/pausa
    if (fired(BTN.L1)) ipcRenderer.send(C.KEY, 'Left')        // -10s
    if (fired(BTN.R1)) ipcRenderer.send(C.KEY, 'Right')       // +10s
    if (fired(BTN.OPTIONS) || fired(BTN.PS)) ipcRenderer.send(C.HOME)
  }
  requestAnimationFrame(tick)
}

window.addEventListener('DOMContentLoaded', () => {
  const s = document.createElement('style')
  s.textContent = '*:focus{outline:4px solid #ffd23f !important;outline-offset:3px !important} *,*::before,*::after{cursor:none !important}'
  document.head.appendChild(s)
})
requestAnimationFrame(tick)
