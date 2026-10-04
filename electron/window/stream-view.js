// Camada por cima do menu onde Netflix, Prime, HBO etc. rodam.
const { WebContentsView } = require('electron')

function createStreamView({ getWin, preload }) {
  let view = null

  function fit() {
    const win = getWin()
    if (!win || !view) return
    const [width, height] = win.getContentSize()
    view.setBounds({ x: 0, y: 0, width, height })
  }

  function close() {
    if (!view) return
    const v = view
    view = null // zera antes, para um segundo close não mexer no mesmo view
    const win = getWin()
    try {
      if (win) win.contentView.removeChildView(v)
      v.webContents.close()
    } catch {}
    if (win) win.webContents.focus()
  }

  function open(url) {
    const win = getWin()
    if (!win) return
    close()
    view = new WebContentsView({
      webPreferences: { partition: 'persist:streaming', preload }, // partition mantém seus logins
    })
    const wc = view.webContents
    wc.setUserAgent(wc.getUserAgent().replace(/ ?(Electron|lazy-ps4)\/\S+/g, ''))
    wc.setWindowOpenHandler(({ url: u }) => { wc.loadURL(u); return { action: 'deny' } })
    win.contentView.addChildView(view)
    fit()
    wc.loadURL(url)
    wc.focus()
  }

  // true = voltou uma página; false = não havia para onde voltar
  function back() {
    const h = view && view.webContents.navigationHistory
    if (h && h.canGoBack()) { h.goBack(); return true }
    return false
  }

  function sendKey(keyCode) {
    if (!view) return
    view.webContents.sendInputEvent({ type: 'keyDown', keyCode })
    view.webContents.sendInputEvent({ type: 'keyUp', keyCode })
  }

  const forget = () => { view = null }

  return { open, close, back, sendKey, fit, forget }
}

module.exports = { createStreamView }
