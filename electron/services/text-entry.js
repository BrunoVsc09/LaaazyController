// Teclado do Laaazy por cima de outro programa (ex.: busca ou senha no Edge), em tempo real.
// O teclado nunca pega o foco do Windows: o campo do site continua selecionado e cada tecla
// apertada vai na hora para ele. Abrir guarda a janela da frente; só digita enquanto ela for a
// mesma (se você trocar de programa, o Laaazy não digita no programa errado).
const { validEdit } = require('../core/typing')

// maskMenu: aperta uma tecla neutra para o Alt do atalho não levar o Edge ao menu do navegador
// profileIn/profileOut: controle num perfil sem mouse enquanto o teclado está aberto, e de volta
function createTextEntry({ fgHwnd, showOverlay, hideOverlay, sendEdit, maskMenu = () => {}, profileIn = () => {}, profileOut = () => {} }) {
  let target = null
  let opened = false
  let chain = Promise.resolve() // teclas em ordem, mesmo com a consulta ao Windows demorando

  async function open() {
    maskMenu() // primeiro de tudo: o Alt do Ctrl+Alt+K ainda está apertado
    target = await fgHwnd()
    opened = true
    profileIn()
    showOverlay()
  }

  function close() {
    if (opened) profileOut()
    opened = false
    target = null
    hideOverlay()
  }

  // change = { move, back, text, enter } (ver core/typing)
  function edit(change) {
    const to = target // na hora do pedido: um Enter seguido de fechar ainda chega
    const run = chain.then(async () => {
      if (!to || !validEdit(change)) return false
      if ((await fgHwnd()) !== to) return false
      return sendEdit(change)
    })
    chain = run.catch(() => false)
    return run
  }

  return { open, close, edit }
}

module.exports = { createTextEntry }
