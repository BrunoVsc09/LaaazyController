import { describe, it, expect } from 'vitest'
import { youtubeTvMsg, nextSiteScale, nextSubtitleSize, siteScaleLabel, siteScaleMsg, sizeMenuItems, sizePreview, subtitleLabel, subtitleMsg } from './tv-style'

describe('tamanho da legenda no Edge (Configurações → Streaming)', () => {
  it('Do site → Normal → Grande → Enorme → Gigante, em volta', () => {
    expect(nextSubtitleSize('site')).toBe('normal')
    expect(nextSubtitleSize('grande')).toBe('enorme')
    expect(nextSubtitleSize('enorme')).toBe('gigante')
    expect(nextSubtitleSize('gigante')).toBe('site')
    expect(nextSubtitleSize('estranho')).toBe('site')
  })
  it('rótulo e aviso (vale da próxima vez que o Edge abrir)', () => {
    expect(subtitleLabel('grande')).toBe('Grande')
    expect(subtitleLabel('site')).toBe('Do site')
    expect(subtitleMsg('grande')).toBe('Legenda Grande nos serviços do Edge. Vale da próxima vez que o Edge abrir (feche o serviço e abra de novo).')
    expect(subtitleMsg('site')).toBe('A legenda fica no tamanho de cada site. Vale da próxima vez que o Edge abrir.')
  })
})

describe('tamanho dos sites no Edge (Configurações → Streaming)', () => {
  it('Do site → 125% → 150% → 175% → 200%, em volta', () => {
    expect(nextSiteScale(100)).toBe(125)
    expect(nextSiteScale(175)).toBe(200)
    expect(nextSiteScale(200)).toBe(100)
  })
  it('rótulo e aviso', () => {
    expect(siteScaleLabel(100)).toBe('Do site')
    expect(siteScaleLabel(175)).toBe('175%')
    expect(siteScaleMsg(175)).toBe('Sites do Edge em 175%: títulos e menus maiores. Vale da próxima vez que o Edge abrir (feche o serviço e abra de novo).')
    expect(siteScaleMsg(100)).toBe('Sites do Edge no tamanho normal. Vale da próxima vez que o Edge abrir.')
  })
})

// "Deixe o tamanho e texto customizáveis do lado do controle no início" (Bruno, 2026-10-16)
describe('janelinha "Aa" do topo: tamanho dos sites e da legenda', () => {
  it('as duas linhas com o valor de agora', () => {
    expect(sizeMenuItems({ siteScale: 175, subtitleSize: 'grande' })).toEqual([
      { key: 'siteScale', label: 'Tamanho dos sites: 175%' },
      { key: 'subtitleSize', label: 'Legenda: Grande' },
    ])
  })
  it('sem nada salvo: os padrões (Do site e Grande)', () => {
    expect(sizeMenuItems({}).map((i) => i.label)).toEqual(['Tamanho dos sites: Do site', 'Legenda: Grande'])
  })
})

// "Deixe fotos de modelo pro usuário diferenciar os tamanhos" (Bruno, 2026-10-16): uma telinha em
// 16:9 que desenha a legenda e os títulos na mesma proporção da tela de verdade (em % da altura)
describe('exemplo na janelinha: medidas em % da altura da telinha', () => {
  it('legenda: o mesmo vh escolhido (Grande = 8% da altura)', () => {
    expect(sizePreview({ siteScale: 100, subtitleSize: 'grande' }).subtitle).toBe(8)
    expect(sizePreview({ siteScale: 100, subtitleSize: 'gigante' }).subtitle).toBe(12)
  })
  it('legenda "Do site": o tamanho comum dos sites (~4%)', () => {
    expect(sizePreview({ siteScale: 100, subtitleSize: 'site' }).subtitle).toBe(4)
  })
  it('títulos: crescem com o tamanho dos sites (um título de site tem ~1,8% da altura em 100%)', () => {
    expect(sizePreview({ siteScale: 100, subtitleSize: 'grande' }).title).toBeCloseTo(1.8)
    expect(sizePreview({ siteScale: 175, subtitleSize: 'grande' }).title).toBeCloseTo(3.15)
    expect(sizePreview({ siteScale: 200, subtitleSize: 'grande' }).cards).toBe(3) // cabem menos títulos por fileira
    expect(sizePreview({ siteScale: 100, subtitleSize: 'grande' }).cards).toBe(6)
  })
})

describe('YouTube com tela de TV (Configurações → Streaming)', () => {
  it('aviso de cada escolha', () => {
    expect(youtubeTvMsg(true)).toBe('O YouTube abre com a tela de TV (setas, OK e Voltar). Na 1ª vez, entre pelo celular com o código que aparece. Vale da próxima vez que o Edge abrir.')
    expect(youtubeTvMsg(false)).toBe('O YouTube abre o site comum. Vale da próxima vez que o Edge abrir.')
  })
})
