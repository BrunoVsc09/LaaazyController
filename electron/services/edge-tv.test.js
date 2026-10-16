import { describe, it, expect, vi } from 'vitest'
import mod from './edge-tv.js'

const tick = () => new Promise((r) => setTimeout(r, 0))

// Edge falso no canal: guarda o que o Laaazy mandou, responde aos pedidos e solta eventos
// reply(msg, edge): resposta própria para um pedido (null = {}; 'feito' = o teste responde sozinho)
function fakeEdge(reply = () => null) {
  let onData = () => {}, onExit = () => {}
  const sent = []
  const edge = {
    sent,
    write: (text) => {
      for (const part of text.split('\0').filter(Boolean)) {
        const msg = JSON.parse(part)
        sent.push(msg)
        const custom = reply(msg, edge)
        if (custom !== 'feito') setTimeout(() => onData(JSON.stringify({ id: msg.id, result: custom || {} }) + '\0'), 0)
      }
    },
    onData: (cb) => { onData = cb },
    onExit: (cb) => { onExit = cb },
    emit: (msg) => onData(JSON.stringify(msg) + '\0'),
    exit: () => onExit(),
  }
  return edge
}

function make({ subtitleSize = 'grande', youtubeTv = true, pipedFails = false, reply } = {}) {
  const edges = []
  const openPiped = vi.fn(() => { if (pipedFails) throw new Error('não abriu'); const e = fakeEdge(reply); edges.push(e); return e })
  const openPlain = vi.fn(async () => '')
  const s = mod.createEdgeTv({ openPiped, openPlain, subtitleSize: () => subtitleSize, youtubeTv: () => youtubeTv })
  return { s, edges, openPiped, openPlain }
}
const attached = (sessionId, url, targetId = 'T' + sessionId) => ({ method: 'Target.attachedToTarget', params: { sessionId, targetInfo: { type: 'page', url, targetId }, waitingForDebugger: false } })
const methodsOf = (edge, sessionId) => edge.sent.filter((m) => m.sessionId === sessionId).map((m) => m.method)

describe('edge-tv: canal privado com o Edge do Laaazy', () => {
  // Achado na foto do teste ao vivo: aberta com about:blank, a janela vinha como navegador comum (abas e
  // barra de endereço). Abre já com o endereço, para ser janela de app, e manda de novo com as regras
  it('1ª janela: abre como janela de app do endereço, com o canal, e se liga a tudo que abrir', async () => {
    const { s, edges, openPiped } = make()
    const p = s.open({ exe: 'msedge', profile: 'edge-tv', args: ['--user-data-dir=X'], url: 'https://www.youtube.com/tv' })
    await tick()
    expect(openPiped).toHaveBeenCalledWith('msedge', ['--user-data-dir=X', '--remote-debugging-pipe', '--app=https://www.youtube.com/tv'])
    expect(edges[0].sent[0]).toMatchObject({ method: 'Target.setAutoAttach', params: { autoAttach: true, waitForDebuggerOnStart: true, flatten: true } })
    expect(await p).toBe('')
  })
  it('1ª janela: aplica as regras do endereço pedido e só então vai para ele', async () => {
    const { s, edges } = make()
    await s.open({ exe: 'msedge', profile: 'edge-tv', args: [], url: 'https://www.youtube.com/tv' })
    edges[0].emit(attached('S1', 'https://www.youtube.com/?app=desktop&sbb=1')) // o YouTube já redirecionou
    for (let i = 0; i < 8; i++) await tick()
    expect(methodsOf(edges[0], 'S1')).toEqual(['Network.setUserAgentOverride', 'Page.enable', 'Page.addScriptToEvaluateOnNewDocument', 'Runtime.runIfWaitingForDebugger', 'Page.navigate'])
    expect(edges[0].sent.find((m) => m.method === 'Page.navigate').params.url).toBe('https://www.youtube.com/tv')
  })
  // Achado no teste ao vivo: o "ligar a tudo" só pega janelas que surgem depois; a 1ª janela vazia
  // já existia. O Laaazy procura e se liga a ela (uma vez só, mesmo que o aviso também chegue)
  it('1ª janela que já existia: o Laaazy procura, se liga e trata uma vez só', async () => {
    const reply = (msg, edge) => {
      if (msg.method === 'Target.getTargets') return { targetInfos: [{ type: 'page', url: 'https://www.youtube.com/tv', targetId: 'B' }] }
      if (msg.method === 'Target.attachToTarget') {
        setTimeout(() => { edge.emit({ id: msg.id, result: { sessionId: 'SB' } }); edge.emit(attached('SB', 'https://www.youtube.com/tv', 'B')) }, 0) // o aviso também chega
        return 'feito'
      }
      return null
    }
    const { s, edges } = make({ reply })
    await s.open({ exe: 'msedge', profile: 'edge-tv', args: [], url: 'https://www.youtube.com/tv' })
    for (let i = 0; i < 8; i++) await tick()
    const e = edges[0]
    expect(e.sent.find((m) => m.method === 'Target.attachToTarget').params).toEqual({ targetId: 'B', flatten: true })
    expect(methodsOf(e, 'SB').filter((m) => m === 'Page.navigate')).toHaveLength(1)
  })
  it('1ª janela ainda sem endereço (edge://newtab/): também vai para o endereço pedido', async () => {
    const { s, edges } = make()
    await s.open({ exe: 'msedge', profile: 'edge-tv', args: [], url: 'https://www.youtube.com/tv' })
    edges[0].emit(attached('SN', 'edge://newtab/'))
    for (let i = 0; i < 6; i++) await tick()
    expect(edges[0].sent.find((m) => m.sessionId === 'SN' && m.method === 'Page.navigate').params.url).toBe('https://www.youtube.com/tv')
    expect(methodsOf(edges[0], 'SN')).toContain('Network.setUserAgentOverride')
  })
  it('Edge já ligado ao Laaazy: só abre outra janela (o Edge entrega para o que está aberto)', async () => {
    const { s, openPiped, openPlain } = make()
    await s.open({ exe: 'msedge', profile: 'edge-tv', args: ['--user-data-dir=X'], url: 'https://www.youtube.com/tv' })
    await s.open({ exe: 'msedge', profile: 'edge-tv', args: ['--user-data-dir=X'], url: 'https://www.netflix.com' })
    expect(openPiped).toHaveBeenCalledTimes(1)
    expect(openPlain).toHaveBeenCalledWith('msedge', ['--user-data-dir=X', '--app=https://www.netflix.com'])
  })
  it('janela nova que já começou a carregar: recebe as regras e recarrega uma vez', async () => {
    const { s, edges } = make()
    await s.open({ exe: 'msedge', profile: 'edge-tv', args: [], url: 'https://www.youtube.com/tv' })
    edges[0].emit(attached('S1', 'https://www.youtube.com/tv')) // a 1ª janela chega primeiro
    for (let i = 0; i < 8; i++) await tick()
    edges[0].emit(attached('S2', 'https://www.netflix.com/browse'))
    await tick(); await tick(); await tick()
    expect(methodsOf(edges[0], 'S2')).toEqual(['Page.enable', 'Page.addScriptToEvaluateOnNewDocument', 'Runtime.runIfWaitingForDebugger', 'Page.navigate'])
  })
  it('o que não é janela (service worker, etc.): só deixa seguir', async () => {
    const { s, edges } = make()
    await s.open({ exe: 'msedge', profile: 'edge-tv', args: [], url: 'https://www.youtube.com/tv' })
    edges[0].emit({ method: 'Target.attachedToTarget', params: { sessionId: 'W', targetInfo: { type: 'service_worker', url: 'https://www.youtube.com/sw.js' }, waitingForDebugger: true } })
    await tick(); await tick()
    expect(methodsOf(edges[0], 'W')).toEqual(['Runtime.runIfWaitingForDebugger'])
  })
  it('"Do site" e sem TV: as janelas seguem sem mexer em nada', async () => {
    const { s, edges } = make({ subtitleSize: 'site', youtubeTv: false })
    await s.open({ exe: 'msedge', profile: 'edge-tv', args: [], url: 'https://www.netflix.com' })
    edges[0].emit(attached('S3', 'https://www.netflix.com'))
    await tick(); await tick(); await tick()
    expect(methodsOf(edges[0], 'S3')).toEqual(['Runtime.runIfWaitingForDebugger', 'Page.navigate'])
  })
  it('o Edge fechou: na próxima vez abre com o canal de novo', async () => {
    const { s, edges, openPiped } = make()
    await s.open({ exe: 'msedge', profile: 'edge-tv', args: [], url: 'https://www.youtube.com/tv' })
    edges[0].exit()
    await s.open({ exe: 'msedge', profile: 'edge-tv', args: [], url: 'https://www.youtube.com/tv' })
    expect(openPiped).toHaveBeenCalledTimes(2)
  })
  it('cada perfil do Edge tem o seu canal (o sem aceleração é outro processo)', async () => {
    const { s, openPiped } = make()
    await s.open({ exe: 'msedge', profile: 'edge-tv', args: [], url: 'https://www.youtube.com/tv' })
    await s.open({ exe: 'msedge', profile: 'edge-tv-sem-aceleracao', args: [], url: 'https://www.crunchyroll.com' })
    expect(openPiped).toHaveBeenCalledTimes(2)
  })
  it('o canal não abriu: abre o Edge do jeito de antes (sem as regras, mas abre)', async () => {
    const { s, openPlain } = make({ pipedFails: true })
    expect(await s.open({ exe: 'msedge', profile: 'edge-tv', args: ['--user-data-dir=X'], url: 'https://www.netflix.com' })).toBe('')
    expect(openPlain).toHaveBeenCalledWith('msedge', ['--user-data-dir=X', '--app=https://www.netflix.com'])
  })
})
