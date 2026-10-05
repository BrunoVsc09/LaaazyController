// Botão "Área de trabalho" do Início: o controle vira mouse (perfil da Área de trabalho,
// "PC" por padrão), a volta automática para e o Laaazy é minimizado. O PS traz de volta.
function createDesktop({ ds4, returnWatch, minimize }) {
  let active = false

  async function enter() {
    await ds4.ensureRunning()
    const r = await ds4.applyFor('desktop')
    returnWatch.stop()
    active = true
    minimize()
    return { ok: r.ok, msg: r.ok ? '' : r.msg }
  }

  const leave = () => { active = false }
  const isActive = () => active

  return { enter, leave, isActive }
}

module.exports = { createDesktop }
