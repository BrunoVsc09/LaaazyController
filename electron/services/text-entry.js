// Teclado do Laaazy por cima de outro programa (ex.: busca ou senha no Edge).
// Abrir guarda a janela da frente; "Pronto" esconde o teclado, espera essa janela voltar
// (com o campo ainda selecionado) e digita o texto nela.
const CONTROL = /[\u0000-\u001f\u007f]/
const BACK_MS = 250
// Depois que a janela volta, o site ainda precisa reselecionar o campo; digitar antes disso perde as letras
const SETTLE_MS = 800

function createTextEntry({ fgHwnd, showOverlay, hideOverlay, focusWindow, typeText, sleep }) {
  let target = null

  async function open() {
    target = await fgHwnd()
    showOverlay()
  }

  function cancel() {
    target = null
    hideOverlay()
  }

  async function submit(text) {
    const to = target
    target = null
    hideOverlay()
    if (!to || typeof text !== 'string' || !text || text.length > 500 || CONTROL.test(text)) return false
    await sleep(BACK_MS) // o Windows devolve o foco para a janela de antes
    // Só puxa o foco se outra janela conhecida estiver na frente (o truque do Alt tira o foco da página)
    const now = await fgHwnd()
    if (now && now !== to) focusWindow(to)
    await sleep(SETTLE_MS)
    return typeText(text)
  }

  return { open, cancel, submit }
}

module.exports = { createTextEntry }
