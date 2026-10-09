// Botão PS (Ctrl+Alt+Home vindo do Laaazy-pad): mata o que está na frente e volta ao Início.
// Opção "como console" (psClosesApp = false): só volta ao Início.
// Modo teste (tela Perfis do controle): o próximo aperto só confirma que o atalho chegou.
const TEST_MS = 15000

function createPsButton({ foreground, home, psClosesApp, ensureDs4, notifyTested, desktopActive = () => false, now = Date.now }) {
  let testUntil = 0

  function startTest() {
    testUntil = now() + TEST_MS
    ensureDs4() // o PS só vira Ctrl+Alt+Home com o Laaazy-pad aberto
    return true
  }

  async function press() {
    if (testUntil && now() <= testUntil) {
      testUntil = 0
      notifyTested()
      return 'tested'
    }
    testUntil = 0
    // Na Área de trabalho o que está na frente é do usuário (Explorer, navegador): não mata
    if (!psClosesApp() || desktopActive()) { home(); return 'home' }
    await foreground.closeAndHome()
    return 'closed'
  }

  return { press, startTest }
}

module.exports = { createPsButton }
