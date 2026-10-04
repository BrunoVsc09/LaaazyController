// Janelas do Windows para escolher pasta/arquivo e mostrar erro.
function createDialogs({ dialog, getWin }) {
  async function chooseDir(title) {
    const r = await dialog.showOpenDialog(getWin(), { title, properties: ['openDirectory'] })
    return r.canceled ? null : r.filePaths[0] || null
  }

  async function chooseExe() {
    const r = await dialog.showOpenDialog(getWin(), {
      title: 'Escolha o executável do jogo', properties: ['openFile'],
      filters: [{ name: 'Programas', extensions: ['exe', 'lnk'] }],
    })
    return r.canceled ? null : r.filePaths[0] || null
  }

  const showError = (title, msg) => dialog.showErrorBox(title, msg)

  return { chooseDir, chooseExe, showError }
}

module.exports = { createDialogs }
