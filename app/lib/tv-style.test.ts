import { describe, it, expect } from 'vitest'
import { nextSiteScale, nextSubtitleSize, siteScaleLabel, siteScaleMsg, subtitleLabel, subtitleMsg } from './tv-style'

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
