// Janela principal: tela cheia e "trazer o menu para a frente" (por cima de jogos e do Edge).
const { BrowserWindow } = require('electron')
const { hwndFrom } = require('../core/focus')

// forceFocus(hwnd): passa pelo bloqueio de foco do Windows (ver adapters/ps-foreground)
function createWindowManager({ preload, onFocus, onResize, onClosed, forceFocus = () => {} }) {
  let win = null
  // Depois de fechada, a janela continua existindo mas todo método lança exceção
  const alive = () => !!win && !win.isDestroyed()
  const get = () => (alive() ? win : null)

  function create(url) {
    win = new BrowserWindow({
      fullscreen: true,
      autoHideMenuBar: true,
      backgroundColor: '#0b3f9d',
      // Prévia do trailer com som no Início sem precisar de um clique antes
      webPreferences: { preload, autoplayPolicy: 'no-user-gesture-required' },
    })
    win.setMenuBarVisibility(false)
    win.removeMenu() // o Alt do truque de foco não pode mostrar menu nenhum
    win.setMenu(null)
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
    forceFocus(hwndFrom(win.getNativeWindowHandle()))
    win.webContents.focus() // o controle (Gamepad API) só funciona com a página em foco
    // Se o Steam (ou outro app) roubar o foco logo depois, pega de volta
    for (const ms of [350, 900]) {
      setTimeout(() => {
        if (alive() && !win.isFocused()) {
          win.setAlwaysOnTop(true); win.show(); win.focus()
          forceFocus(hwndFrom(win.getNativeWindowHandle()))
          win.webContents.focus(); win.setAlwaysOnTop(false)
        }
      }, ms)
    }
    setTimeout(() => alive() && win.setAlwaysOnTop(false), 1200)
  }

  const send = (channel, ...args) => { if (alive()) win.webContents.send(channel, ...args) }

  return { create, get, bringToFront, send }
}

module.exports = { createWindowManager }
