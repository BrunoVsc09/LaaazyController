// Cursor preso na janela do Laaazy enquanto ele está na frente (não escapa para outro monitor).
// Solta quando o Laaazy sai da frente, minimiza ou fecha. Desligável em Configurações.
const { clipCommand, confineCommands, UNCLIP } = require('../core/focus')

function createCursorLock({ send, bounds, enabled }) {
  const unlock = () => send(UNCLIP)
  function lock() {
    if (!enabled()) return unlock()
    const cmd = clipCommand(bounds())
    if (cmd) send(cmd)
  }
  // Teclado por cima: o cursor fica dentro dele (vale mesmo com a opção "prender o mouse" desligada)
  const confine = (rect) => { for (const cmd of confineCommands(rect)) send(cmd) }
  return { lock, unlock, confine }
}

module.exports = { createCursorLock }
