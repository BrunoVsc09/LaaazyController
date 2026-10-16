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
