// Botão PS (F24 vindo do DS4Windows): mata o que está na frente e volta ao Início.
// Opção "como console" (psClosesApp = false): só volta ao Início.
// Modo teste (tela Perfis do controle): o próximo aperto só confirma que o F24 chegou.
const TEST_MS = 15000

function createPsButton({ foreground, home, psClosesApp, ensureDs4, notifyTested, desktopActive = () => false, now = Date.now }) {
  let testUntil = 0

  function startTest() {
    testUntil = now() + TEST_MS
    ensureDs4() // o PS só vira F24 com o DS4Windows aberto
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
