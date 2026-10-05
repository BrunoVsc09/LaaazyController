// Janela do teclado do Laaazy por cima de outros programas (ex.: Edge em tela cheia).
// Fica na metade de baixo da tela, sempre por cima, fora da barra de tarefas.
const { BrowserWindow, screen } = require('electron')
const C = require('../../shared/channels')

function createKeyboardOverlay({ preload, url }) {
  let win = null

  function ensure() {
    if (win && !win.isDestroyed()) return win
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    win = new BrowserWindow({
      x: 0, y: Math.round(height * 0.42), width, height: Math.round(height * 0.58),
      frame: false, show: false, resizable: false, skipTaskbar: true, alwaysOnTop: true,
      backgroundColor: '#08183c',
      webPreferences: { preload },
    })
    win.setAlwaysOnTop(true, 'screen-saver') // por cima até de programas em tela cheia
    win.removeMenu()
    win.loadURL(url)
    return win
  }

  function show() {
    const w = ensure()
    const go = () => {
      w.webContents.send(C.OSK_OPENED)
      w.show()
      w.focus()
      w.webContents.focus() // o controle (Gamepad API) só funciona com a página em foco
    }
    if (w.webContents.isLoading()) w.webContents.once('did-finish-load', go)
    else go()
  }

  // Ao esconder, o Windows devolve o foco para a janela de antes (o Edge, no campo selecionado)
  const hide = () => { if (win && !win.isDestroyed()) win.hide() }

  return { show, hide }
}

module.exports = { createKeyboardOverlay }
