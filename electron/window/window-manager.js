// Janela principal: tela cheia e "trazer o menu para a frente" (por cima de jogos e do Edge).
const { BrowserWindow } = require('electron')

function createWindowManager({ preload, onFocus, onResize, onClosed }) {
  let win = null
  // Depois de fechada, a janela continua existindo mas todo método lança exceção
  const alive = () => !!win && !win.isDestroyed()
  const get = () => (alive() ? win : null)

  function create(url) {
    win = new BrowserWindow({
      fullscreen: true,
      autoHideMenuBar: true,
      backgroundColor: '#0b3f9d',
      webPreferences: { preload },
    })
    win.setMenuBarVisibility(false)
    for (const ev of ['resize', 'enter-full-screen', 'leave-full-screen']) win.on(ev, onResize)
    win.on('closed', () => { win = null; onClosed() })
    win.on('focus', onFocus)
    win.loadURL(url)
    return win
  }

  function bringToFront() {
    if (!alive()) return
    if (win.isMinimized()) win.restore()
    win.setAlwaysOnTop(true)
    win.show()
    win.moveTop()
    win.focus()
    win.setFullScreen(true)
    // Se o Steam (ou outro app) roubar o foco logo depois, pega de volta
    for (const ms of [350, 900]) {
      setTimeout(() => {
        if (alive() && !win.isFocused()) { win.setAlwaysOnTop(true); win.show(); win.focus(); win.setAlwaysOnTop(false) }
      }, ms)
    }
    setTimeout(() => alive() && win.setAlwaysOnTop(false), 1200)
  }

  const send = (channel, ...args) => { if (alive()) win.webContents.send(channel, ...args) }

  return { create, get, bringToFront, send }
}

module.exports = { createWindowManager }
