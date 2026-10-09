import { describe, it, expect } from 'vitest'
import mod from './settings.js'

const make = (initial = {}) => {
  let data = initial
  const s = mod.createSettings({ read: () => data, write: (d) => { data = d; return true } })
  return { s, data: () => data }
}

describe('settings', () => {
  it('padrões: fechar DS4 ao apertar PS ligado, biblioteca A→Z, sem modos de streaming', () => {
    const { s } = make()
    expect(s.get('closeDs4OnMenu')).toBe(true)
    expect(s.get('librarySort')).toBe('asc')
    expect(s.get('streamModes')).toEqual({})
  })
  it('valor salvo vence o padrão', () => {
    expect(make({ closeDs4OnMenu: false }).s.get('closeDs4OnMenu')).toBe(false)
  })
  it('grava chave conhecida com valor válido, mantendo as outras', () => {
    const { s, data } = make({ edgePath: 'C:\\E' })
    expect(s.set('laaazyPadPath', 'C:\\Pad')).toBe(true)
    expect(data()).toEqual({ edgePath: 'C:\\E', laaazyPadPath: 'C:\\Pad' })
    expect(s.set('ds4Path', 'C:\\DS4')).toBe(false) // o DS4Windows saiu
  })
  it('streamModes só aceita serviços do catálogo com app/edge', () => {
    const { s } = make()
    expect(s.set('streamModes', { Netflix: 'edge' })).toBe(true)
    expect(s.set('streamModes', { Netflix: 'chrome' })).toBe(false)
    expect(s.set('streamModes', { Minecraft: 'app' })).toBe(false)
  })
  it('pinnedApps: lista de nomes, sem itens vazios e com limite', () => {
    const { s } = make()
    expect(s.set('pinnedApps', ['Netflix', 'Firefox'])).toBe(true)
    expect(s.set('pinnedApps', [])).toBe(true)
    expect(s.set('pinnedApps', ['Netflix', ''])).toBe(false)
    expect(s.set('pinnedApps', 'Netflix')).toBe(false)
    expect(s.set('pinnedApps', Array(31).fill('x'))).toBe(false)
  })
  it('proteção de tela: padrão 10 minutos; só 0, 5, 10, 15 ou 30', () => {
    const { s } = make()
    expect(s.get('screensaverMinutes')).toBe(10)
    expect(s.set('screensaverMinutes', 0)).toBe(true)
    expect(s.set('screensaverMinutes', 7)).toBe(false)
    expect(s.set('screensaverMinutes', '5')).toBe(false)
  })
  it('geminiModel: padrão gemini-3.8-flash; só nomes de modelo válidos', () => {
    const { s } = make()
    expect(s.get('geminiModel')).toBe('gemini-3.8-flash')
    expect(s.set('geminiModel', 'gemini-3.5-flash')).toBe(true)
    expect(s.set('geminiModel', '../../x')).toBe(false)
    expect(s.set('geminiModel', 'Gemini 3.8 Flash')).toBe(false)
  })
  it('psClosesApp: padrão fechar o jogo; só sim/não', () => {
    const { s } = make()
    expect(s.get('psClosesApp')).toBe(true)
    expect(s.set('psClosesApp', false)).toBe(true)
    expect(s.set('psClosesApp', 'nao')).toBe(false)
  })
  it('trailerPreview: prévia do trailer no Início ligada por padrão', () => {
    const { s } = make()
    expect(s.get('trailerPreview')).toBe(true)
    expect(s.set('trailerPreview', false)).toBe(true)
    expect(s.set('trailerPreview', 'sim')).toBe(false)
  })
  it('trailerSound: prévia começa sem som por padrão', () => {
    const { s } = make()
    expect(s.get('trailerSound')).toBe(false)
    expect(s.set('trailerSound', true)).toBe(true)
    expect(s.set('trailerSound', 1)).toBe(false)
  })
  it('lockCursor: cursor preso na tela do Laaazy por padrão', () => {
    const { s } = make()
    expect(s.get('lockCursor')).toBe(true)
    expect(s.set('lockCursor', false)).toBe(true)
    expect(s.set('lockCursor', 'não')).toBe(false)
  })
  it('edgeNoGpu: streamings que abrem no Edge sem aceleração de vídeo; Crunchyroll por padrão', () => {
    const { s } = make()
    expect(s.get('edgeNoGpu')).toEqual(['Crunchyroll'])
    expect(s.set('edgeNoGpu', ['Crunchyroll', 'Netflix'])).toBe(true)
    expect(s.set('edgeNoGpu', ['Fantasma'])).toBe(false)
    expect(s.set('edgeNoGpu', 'Crunchyroll')).toBe(false)
  })
  it('recusa chave desconhecida e valor do tipo errado', () => {
    const { s, data } = make()
    expect(s.set('hacker', 1)).toBe(false)
    expect(s.set('closeDs4OnMenu', 'sim')).toBe(false)
    expect(s.set('librarySort', 'aleatorio')).toBe(false)
    expect(data()).toEqual({})
  })
})
