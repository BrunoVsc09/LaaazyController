import { describe, it, expect } from 'vitest'
import mod from './tv-style.js'

// Legenda grande nos serviços do Edge (pedido do Bruno, 2026-10-16: "de longe não consigo ler a
// legenda"). O Laaazy põe esse CSS em cada página pelo canal privado com o Edge (services/edge-tv).
describe('tv-style: CSS da legenda', () => {
  it('"Do site" (ou tamanho desconhecido): nada', () => {
    expect(mod.subtitleCss('site')).toBe('')
    expect(mod.subtitleCss('qualquer')).toBe('')
  })
  it('a legenda no tamanho escolhido, com contorno, em cada serviço', () => {
    const css = mod.subtitleCss('grande')
    for (const sel of ['.player-timedtext-text-container span', '.atvwebplayersdk-captions-text', '.ytp-caption-segment', 'video::cue']) {
      expect(css, sel).toContain(sel)
    }
    expect(css).toMatch(/font-size: 8vh !important/)
    expect(css).toMatch(/text-shadow: 0 0 3px #000/)
    expect(mod.subtitleCss('enorme')).toMatch(/font-size: 10vh !important/)
    expect(mod.subtitleCss('normal')).toMatch(/font-size: 6vh !important/)
    // "queria aumentar mais o tamanho da legenda" (Bruno, 2026-10-16)
    expect(mod.subtitleCss('gigante')).toMatch(/font-size: 12vh !important/)
  })
})

// YouTube com a tela de TV (pedido do Bruno, 2026-10-16): o Edge ignora --user-agent; o Laaazy troca
// a "cara" pelo canal com o Edge
describe('tv-style: a "cara" de TV', () => {
  it('é de uma TV Samsung (Tizen)', () => {
    expect(mod.TV_USER_AGENT).toMatch(/SMART-TV.*Tizen/)
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
