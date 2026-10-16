import { describe, it, expect } from 'vitest'
import mod from './edge-tv.js'

const { splitFrames, frame, pageSetup, needsReload } = mod

// O Laaazy fala com o Edge pelo canal privado (--remote-debugging-pipe): mensagens JSON separadas
// por \0. Troca a extensão, que o Edge 155 desativava depois da 1ª abertura de cada perfil.
describe('edge-tv: mensagens do canal', () => {
  it('cada mensagem vai em JSON terminada em \\0', () => {
    expect(frame({ id: 1, method: 'Target.getTargets' })).toBe('{"id":1,"method":"Target.getTargets"}\0')
  })
  it('separa as mensagens que chegam juntas e guarda o pedaço que ainda não terminou', () => {
    const r = splitFrames('{"id":1}\0{"id":2}\0{"id":')
    expect(r.messages).toEqual([{ id: 1 }, { id: 2 }])
    expect(r.rest).toBe('{"id":')
    expect(splitFrames(r.rest + '3}\0').messages).toEqual([{ id: 3 }])
  })
  it('mensagem quebrada é ignorada (não derruba o canal)', () => {
    expect(splitFrames('{quebrada\0{"id":4}\0').messages).toEqual([{ id: 4 }])
  })
})

describe('edge-tv: o que fazer em cada janela nova do Edge', () => {
  const methods = (cmds) => cmds.map((c) => c.method)
  it('YouTube com tela de TV: troca a "cara" para TV (sem as client hints do Windows)', () => {
    const cmds = pageSetup({ url: 'https://www.youtube.com/tv', subtitleSize: 'site', youtubeTv: true })
    const ua = cmds.find((c) => c.method === 'Network.setUserAgentOverride')
    expect(ua.params.userAgent).toMatch(/SMART-TV.*Tizen/)
    expect(ua.params.userAgentMetadata).toMatchObject({ brands: [], platform: '', mobile: false })
  })
  it('a "cara" de TV é só no YouTube', () => {
    expect(methods(pageSetup({ url: 'https://www.netflix.com/browse', subtitleSize: 'site', youtubeTv: true }))).not.toContain('Network.setUserAgentOverride')
    expect(methods(pageSetup({ url: 'https://www.youtube.com/tv', subtitleSize: 'site', youtubeTv: false }))).not.toContain('Network.setUserAgentOverride')
  })
  it('legenda grande: põe a folha de estilo em toda página nova (e na que já está aberta)', () => {
    const cmds = pageSetup({ url: 'https://www.netflix.com/watch/1', subtitleSize: 'grande', youtubeTv: false })
    // Achado no teste ao vivo: sem o Page.enable antes, o Edge aceita o script e não roda
    const i = cmds.findIndex((c) => c.method === 'Page.addScriptToEvaluateOnNewDocument')
    expect(cmds[i - 1].method).toBe('Page.enable')
    const add = cmds[i]
    expect(add.params.source).toContain('font-size: 8vh !important')
    expect(add.params.source).toContain('laaazy-tv')
    expect(add.params.runImmediately).toBe(true)
  })
  // Achado no teste ao vivo: posto no começo, a página monta o documento por cima e o estilo some
  it('a folha de estilo volta quando a página termina de montar ou a tira', () => {
    const { source } = pageSetup({ url: 'https://www.netflix.com', subtitleSize: 'grande', youtubeTv: false }).find((c) => c.method === 'Page.addScriptToEvaluateOnNewDocument').params
    expect(source).toContain('DOMContentLoaded')
    expect(source).toContain('MutationObserver')
  })
  it('"Do site" e sem TV: nada a fazer', () => {
    expect(pageSetup({ url: 'https://www.netflix.com', subtitleSize: 'site', youtubeTv: false })).toEqual([])
  })
  it('a janela já começou a carregar antes do Laaazy se ligar: recarrega uma vez, já com as regras', () => {
    expect(needsReload('https://www.youtube.com/tv')).toBe(true)
    expect(needsReload('about:blank')).toBe(false)
    expect(needsReload('')).toBe(false)
    expect(needsReload('edge://newtab/')).toBe(false)
  })
})
