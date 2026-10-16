import { describe, it, expect } from 'vitest'
import mod from './tv-style.js'

// Legenda grande nos serviços do Edge (pedido do Bruno, 2026-10-16: "de longe não consigo ler a
// legenda"). O Laaazy grava uma extensão só de CSS e abre o Edge com ela.
describe('tv-style: extensão do Laaazy para o Edge', () => {
  it('"Do site": não grava extensão nenhuma', () => {
    expect(mod.extensionFiles('site')).toBeNull()
    expect(mod.extensionFiles('qualquer')).toBeNull()
  })
  it('manifesto: Manifest V3, só CSS, sem nenhuma permissão', () => {
    const m = JSON.parse(mod.extensionFiles('grande')['manifest.json'])
    expect(m.manifest_version).toBe(3)
    expect(m.permissions).toBeUndefined()
    expect(m.host_permissions).toBeUndefined()
    expect(m.background).toBeUndefined()
    expect(m.content_scripts).toEqual([{ matches: mod.MATCHES, css: ['tv.css'], run_at: 'document_start' }])
  })
  it('vale nos serviços do Laaazy (e só neles)', () => {
    expect(mod.MATCHES).toEqual([
      'https://www.netflix.com/*', 'https://www.primevideo.com/*', 'https://*.hbomax.com/*', 'https://play.max.com/*',
      'https://www.crunchyroll.com/*', 'https://www.youtube.com/*',
    ])
  })
  it('CSS: a legenda no tamanho escolhido, com contorno, em cada serviço', () => {
    const css = mod.extensionFiles('grande')['tv.css']
    for (const sel of ['.player-timedtext-text-container span', '.atvwebplayersdk-captions-text', '.ytp-caption-segment', 'video::cue']) {
      expect(css, sel).toContain(sel)
    }
    expect(css).toMatch(/font-size: 8vh !important/)
    expect(css).toMatch(/text-shadow: 0 0 3px #000/)
    expect(mod.extensionFiles('enorme')['tv.css']).toMatch(/font-size: 10vh !important/)
    expect(mod.extensionFiles('normal')['tv.css']).toMatch(/font-size: 6vh !important/)
    // "queria aumentar mais o tamanho da legenda" (Bruno, 2026-10-16)
    expect(mod.extensionFiles('gigante')['tv.css']).toMatch(/font-size: 12vh !important/)
  })
  it('só visual: nenhum script, só a folha de estilo', () => {
    expect(Object.keys(mod.extensionFiles('grande')).sort()).toEqual(['manifest.json', 'tv.css'])
  })
})

// "O tamanho do site" (Bruno, 2026-10-16): o Edge do Laaazy abre como se a tela fosse maior
describe('tv-style: tamanho dos sites no Edge', () => {
  it('100% ("Do site"): nada', () => {
    expect(mod.siteScaleArgs(100)).toEqual([])
  })
  it('maior: --force-device-scale-factor (títulos, capas e menus crescem juntos, sem desmontar o site)', () => {
    expect(mod.siteScaleArgs(175)).toEqual(['--force-device-scale-factor=1.75'])
    expect(mod.siteScaleArgs(150)).toEqual(['--force-device-scale-factor=1.5'])
    expect(mod.siteScaleArgs(200)).toEqual(['--force-device-scale-factor=2'])
  })
  it('valor fora da lista: nada (nunca um número estranho no Edge)', () => {
    expect(mod.siteScaleArgs(999)).toEqual([])
    expect(mod.siteScaleArgs('175')).toEqual([])
  })
})

// YouTube com a tela de TV de verdade (pedido do Bruno, 2026-10-16: "o máximo possível igual o da TV").
// O Edge ignora --user-agent; só a troca completa (cabeçalho + navigator, sem as client hints) faz o
// youtube.com/tv abrir a tela de TV (conferido no Edge 155)
describe('tv-style: YouTube com tela de TV', () => {
  const files = mod.extensionFiles('grande', { youtubeTv: true })
  const manifest = JSON.parse(files['manifest.json'])
  it('pede só o que precisa, e só no YouTube', () => {
    expect(manifest.permissions).toEqual(['declarativeNetRequest'])
    expect(manifest.host_permissions).toEqual(['https://*.youtube.com/*'])
    expect(manifest.declarative_net_request).toEqual({ rule_resources: [{ id: 'youtube_tv', enabled: true, path: 'youtube-tv.json' }] })
  })
  it('troca o cabeçalho só para youtube.com: User-Agent de TV e sem as client hints do Windows', () => {
    const [rule] = JSON.parse(files['youtube-tv.json'])
    expect(rule.condition.requestDomains).toEqual(['youtube.com'])
    expect(rule.action.type).toBe('modifyHeaders')
    expect(rule.action.requestHeaders[0]).toEqual({ header: 'User-Agent', operation: 'set', value: mod.TV_USER_AGENT })
    const removed = rule.action.requestHeaders.filter((h) => h.operation === 'remove').map((h) => h.header)
    expect(removed).toEqual(expect.arrayContaining(['sec-ch-ua', 'sec-ch-ua-platform', 'sec-ch-ua-mobile']))
  })
  it('e o navigator da página do YouTube (antes do site rodar)', () => {
    const tv = manifest.content_scripts.find((c) => c.js)
    expect(tv).toEqual({ matches: ['https://www.youtube.com/*'], js: ['youtube-tv.js'], run_at: 'document_start', world: 'MAIN' })
    expect(files['youtube-tv.js']).toContain(JSON.stringify(mod.TV_USER_AGENT))
    expect(files['youtube-tv.js']).toMatch(/userAgentData/)
  })
  // Achado no teste ao vivo: o Edge abre a 1ª página antes de a regra da extensão ficar pronta, e o
  // YouTube manda para o site comum (?app=desktop&sbb=1). A página volta para o /tv (no máximo 2 vezes)
  it('se o YouTube mandar para o site comum logo na abertura, volta para o /tv (sem loop)', () => {
    const js = files['youtube-tv.js']
    expect(js).toMatch(/app=desktop/)
    expect(js).toMatch(/sbb=1/)
    expect(js).toMatch(/location\.replace\('https:\/\/www\.youtube\.com\/tv'\)/)
    expect(js).toMatch(/sessionStorage/)
  })
  it('a "cara" de TV é de uma TV Samsung (Tizen)', () => {
    expect(mod.TV_USER_AGENT).toMatch(/SMART-TV.*Tizen/)
  })
  it('legenda "Do site" com YouTube de TV: a extensão vai só com a parte do YouTube', () => {
    const f = mod.extensionFiles('site', { youtubeTv: true })
    expect(Object.keys(f).sort()).toEqual(['manifest.json', 'youtube-tv.js', 'youtube-tv.json'])
    expect(JSON.parse(f['manifest.json']).content_scripts.some((c) => c.css)).toBe(false)
  })
  it('sem YouTube de TV: continua só CSS e sem permissão nenhuma', () => {
    const m = JSON.parse(mod.extensionFiles('grande', { youtubeTv: false })['manifest.json'])
    expect(m.permissions).toBeUndefined()
    expect(m.host_permissions).toBeUndefined()
  })
})
