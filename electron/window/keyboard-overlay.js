// Janela do teclado do Laaazy por cima de outros programas (ex.: Edge em tela cheia).
// Fica na metade de baixo da tela, sempre por cima, fora da barra de tarefas.
const { BrowserWindow, screen } = require('electron')
const C = require('../../shared/channels')
const { lockWindow } = require('./window-manager')
const { hwndFrom } = require('../core/focus')

// forceFocus(hwnd): passa pelo bloqueio de foco do Windows (o mesmo truque da janela principal)
function createKeyboardOverlay({ preload, url, icon, forceFocus = () => {} }) {
  let win = null

  function ensure() {
    if (win && !win.isDestroyed()) return win
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    win = new BrowserWindow({
      x: 0, y: Math.round(height * 0.42), width, height: Math.round(height * 0.58),
      frame: false, show: false, resizable: false, skipTaskbar: true, alwaysOnTop: true,
      backgroundColor: '#08183c',
      icon,
      webPreferences: { preload },
    })
    win.setAlwaysOnTop(true, 'screen-saver') // por cima até de programas em tela cheia
    win.removeMenu()
    lockWindow(win)
    win.loadURL(url)
    return win
  }

  function show() {
    const w = ensure()
    const go = () => {
      w.webContents.send(C.OSK_OPENED)
      w.show()
      w.focus()
      // O Windows às vezes não deixa um programa de segundo plano pegar a frente: sem foco,
      // a borda das teclas não aparece e o controle não anda. Força, e tenta de novo logo depois.
      const grab = () => {
        if (win !== w || w.isDestroyed() || !w.isVisible()) return
        if (!w.isFocused()) forceFocus(hwndFrom(w.getNativeWindowHandle()))
        w.webContents.focus() // o controle (Gamepad API) só funciona com a página em foco
      }
      grab()
      for (const ms of [150, 500]) setTimeout(grab, ms)
    }
    if (w.webContents.isLoading()) w.webContents.once('did-finish-load', go)
    else go()
  }

  // Ao esconder, o Windows devolve o foco para a janela de antes (o Edge, no campo selecionado)
  const hide = () => { if (win && !win.isDestroyed()) win.hide() }

  // Retângulo do teclado em pixels de tela (para prender o cursor dentro dele)
  function screenBounds() {
    if (!win || win.isDestroyed()) return null
    const r = screen.dipToScreenRect(win, win.getBounds())
    return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }
  }

  return { show, hide, screenBounds }
}

module.exports = { createKeyboardOverlay }
