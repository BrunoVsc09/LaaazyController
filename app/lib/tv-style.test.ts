import { describe, it, expect } from 'vitest'
import { nextSubtitleSize, subtitleLabel, subtitleMsg } from './tv-style'

describe('tamanho da legenda no Edge (Configurações → Streaming)', () => {
  it('Do site → Normal → Grande → Enorme, em volta', () => {
    expect(nextSubtitleSize('site')).toBe('normal')
    expect(nextSubtitleSize('grande')).toBe('enorme')
    expect(nextSubtitleSize('enorme')).toBe('site')
    expect(nextSubtitleSize('estranho')).toBe('site')
  })
  it('rótulo e aviso (vale da próxima vez que o Edge abrir)', () => {
    expect(subtitleLabel('grande')).toBe('Grande')
    expect(subtitleLabel('site')).toBe('Do site')
    expect(subtitleMsg('grande')).toBe('Legenda Grande nos serviços do Edge. Vale da próxima vez que o Edge abrir (feche o serviço e abra de novo).')
    expect(subtitleMsg('site')).toBe('A legenda fica no tamanho de cada site. Vale da próxima vez que o Edge abrir.')
  })
})
