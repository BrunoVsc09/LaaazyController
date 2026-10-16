// Streaming: o Laaazy fala com o Edge do perfil dele pelo canal privado (--remote-debugging-pipe; só o
// Laaazy enxerga, sem porta aberta) e, em cada janela nova, põe a legenda grande e a "cara" de TV no
// YouTube. Um canal por perfil do Edge (o sem aceleração é outro processo). Fechar o Laaazy fecha o
// canal, e o Edge fecha junto.
const { frame, splitFrames, pageSetup, needsReload } = require('../core/edge-tv')

// openPiped(exe, args) → { write(texto), onData(cb), onExit(cb) } (adapters/edge-pipe)
// openPlain(exe, args) → Promise<'' | erro> (abre solto, como antes)
function createEdgeTv({ openPiped, openPlain, subtitleSize, youtubeTv }) {
  const channels = new Map() // perfil → canal

  // Abre já com o endereço (com about:blank o Edge abria como navegador comum, com abas e barra de
  // endereço); a 1ª janela recebe as regras e vai de novo para o endereço
  function connect(exe, profile, args, url) {
    const edge = openPiped(exe, [...args, '--remote-debugging-pipe', '--app=' + url])
    const waiting = new Map()
    let buffer = ''
    let id = 0
    const channel = { pendingUrl: null, handled: new Set() } // janelas já tratadas (por targetId)
    channel.call = (method, params = {}, sessionId) => new Promise((resolve) => {
      const my = ++id
      waiting.set(my, resolve)
      edge.write(frame({ id: my, method, params, ...(sessionId ? { sessionId } : {}) }))
    })
    edge.onData((chunk) => {
      const r = splitFrames(buffer + chunk)
      buffer = r.rest
      for (const msg of r.messages) {
        if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id) }
        else if (msg.method === 'Target.attachedToTarget') onAttached(channel, msg.params).catch(() => {})
      }
    })
    edge.onExit(() => { if (channels.get(profile) === channel) channels.delete(profile) })
    channels.set(profile, channel)
    return channel
  }

  // Janela nova: as regras e, se ela já começou a carregar, recarrega uma vez com elas. A 1ª vai para
  // o endereço pedido (o YouTube pode já ter redirecionado para o site comum).
  async function onAttached(channel, { sessionId, targetInfo }) {
    if (targetInfo.type !== 'page') return channel.call('Runtime.runIfWaitingForDebugger', {}, sessionId)
    if (channel.handled.has(targetInfo.targetId)) return
    channel.handled.add(targetInfo.targetId)
    const first = channel.pendingUrl
    const url = first ? channel.pendingUrl : targetInfo.url
    if (first) channel.pendingUrl = null
    for (const cmd of pageSetup({ url, subtitleSize: subtitleSize(), youtubeTv: youtubeTv() === true })) {
      await channel.call(cmd.method, cmd.params, sessionId)
    }
    await channel.call('Runtime.runIfWaitingForDebugger', {}, sessionId)
    if (first || needsReload(url)) await channel.call('Page.navigate', { url }, sessionId)
  }

  // Devolve '' quando abriu, ou a mensagem de erro (como o spawnDetached)
  async function open({ exe, profile, args, url }) {
    if (channels.has(profile)) return openPlain(exe, [...args, '--app=' + url])
    let channel
    try {
      channel = connect(exe, profile, args, url)
    } catch {
      return openPlain(exe, [...args, '--app=' + url])
    }
    channel.pendingUrl = url
    await channel.call('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true })
    await attachExisting(channel)
    return ''
  }

  // O "ligar a tudo" só pega as janelas que surgem depois; a 1ª janela vazia já existia
  async function attachExisting(channel) {
    const list = await channel.call('Target.getTargets')
    const pages = ((list.result && list.result.targetInfos) || []).filter((t) => t.type === 'page' && !channel.handled.has(t.targetId))
    for (const targetInfo of pages) {
      const r = await channel.call('Target.attachToTarget', { targetId: targetInfo.targetId, flatten: true })
      if (r.result && r.result.sessionId) await onAttached(channel, { sessionId: r.result.sessionId, targetInfo }).catch(() => {})
    }
  }

  return { open }
}

module.exports = { createEdgeTv }
