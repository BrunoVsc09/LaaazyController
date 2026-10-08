// Teclado do Laaazy por cima de outro programa (ex.: busca ou senha no Edge), em tempo real.
// O teclado nunca pega o foco do Windows: o campo do site continua selecionado e cada tecla
// apertada vai na hora para ele. Abrir guarda a janela da frente; só digita enquanto ela for a
// mesma (se você trocar de programa, o Laaazy não digita no programa errado).
const CONTROL = /[\u0000-\u001f\u007f]/
const MAX = 500

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

  const valid = (back, text) =>
    Number.isInteger(back) && back >= 0 && back <= MAX &&
    typeof text === 'string' && text.length <= MAX && !CONTROL.test(text)

  function edit(back, text) {
    const run = chain.then(async () => {
      const to = target
      if (!to || !valid(back, text)) return false
      if ((await fgHwnd()) !== to) return false
      return sendEdit({ back, text })
    })
    chain = run.catch(() => false)
    return run
  }

  return { open, close, edit }
}

module.exports = { createTextEntry }
