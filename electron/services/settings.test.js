import { describe, it, expect } from 'vitest'
import mod from './settings.js'

const make = (initial = {}) => {
  let data = initial
  const s = mod.createSettings({ read: () => data, write: (d) => { data = d; return true } })
  return { s, data: () => data }
}

describe('settings', () => {
  it('padrões: biblioteca A→Z, sem modos de streaming', () => {
    const { s } = make()
    expect(s.get('librarySort')).toBe('asc')
    expect(s.get('streamModes')).toEqual({})
  })
  it('valor salvo vence o padrão', () => {
    expect(make({ librarySort: 'desc' }).s.get('librarySort')).toBe('desc')
  })
  // Cor do Laaazy (pedido do Bruno, 2026-10-09)
  it('tema: padrão azul; só os temas conhecidos', () => {
    const { s } = make()
    expect(s.get('theme')).toBe('azul')
    for (const t of ['azul', 'preto', 'vermelho', 'moderno']) expect(s.set('theme', t), t).toBe(true)
    expect(s.set('theme', 'rosa')).toBe(false)
  })
  it('"fechar o DS4Windows ao apertar PS" não existe mais', () => {
    const { s } = make()
    expect(s.get('closeDs4OnMenu')).toBeUndefined()
    expect(s.set('closeDs4OnMenu', true)).toBe(false)
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
  it('controle parado desliga: padrão 10 minutos; só 0 (nunca), 5, 10, 15 ou 30', () => {
    const { s } = make()
    expect(s.get('padIdleMinutes')).toBe(10)
    expect(s.set('padIdleMinutes', 0)).toBe(true)
    expect(s.set('padIdleMinutes', 7)).toBe(false)
  })
  it('tamanho da legenda no Edge: padrão Grande; só Do site, Normal, Grande ou Enorme', () => {
    const { s } = make()
    expect(s.get('subtitleSize')).toBe('grande')
    expect(s.set('subtitleSize', 'enorme')).toBe(true)
    expect(s.set('subtitleSize', 'site')).toBe(true)
    expect(s.set('subtitleSize', 'gigante')).toBe(false)
  })
  it('PC sem uso desliga: padrão Nunca (0); só 0, 2, 3, 4 ou 6 horas', () => {
    const { s } = make()
    expect(s.get('idleShutdownHours')).toBe(0)
    expect(s.set('idleShutdownHours', 4)).toBe(true)
    expect(s.set('idleShutdownHours', 1)).toBe(false)
    expect(s.set('idleShutdownHours', '4')).toBe(false)
  })
  it('geminiModel: padrão gemini-3.8-flash; só nomes de modelo válidos', () => {
    const { s } = make()
    expect(s.get('geminiModel')).toBe('gemini-3.8-flash')
    expect(s.set('geminiModel', 'gemini-3.5-flash')).toBe(true)
    expect(s.set('geminiModel', '../../x')).toBe(false)
    expect(s.set('geminiModel', 'Gemini 3.8 Flash')).toBe(false)
  })
  // Novidades da versão (pedido do Bruno 2026-10-14): a última versão cujas novidades a pessoa viu
  it('lastSeenVersion: padrão nenhuma; só versão X.Y.Z', () => {
    const { s } = make()
    expect(s.get('lastSeenVersion')).toBe(null)
    expect(s.set('lastSeenVersion', '3.6.6')).toBe(true)
    for (const v of ['3.6', 'v3.6.6', '3.6.6; rm', 366]) expect(s.set('lastSeenVersion', v), String(v)).toBe(false)
  })
  // Saída de som preferida (Configurações → Som, pedido do Bruno 2026-10-14)
  it('audioOutput: padrão nenhuma; só { id, name } em texto', () => {
    const { s } = make()
    expect(s.get('audioOutput')).toBe(null)
    expect(s.set('audioOutput', { id: '{0.0.0.00000000}.{aaa}', name: 'Fones de ouvido (XDG-342)' })).toBe(true)
    expect(s.set('audioOutput', null)).toBe(true)
    expect(s.set('audioOutput', 'XDG')).toBe(false)
    expect(s.set('audioOutput', { id: 'x', name: 'y', cmd: 'z' })).toBe(false)
  })
  // Equalizador (Configurações → Som, pedido do Bruno 2026-10-14)
  it('equalizer: padrão ligado e plano; só estados válidos', () => {
    const { s } = make()
    expect(s.get('equalizer')).toEqual({ on: true, preset: 'geral', bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: 0, clarity: 0, volume: 0 })
    expect(s.set('equalizer', { on: false, preset: 'jogos', bands: [2, 1, -1, 0, 0, 1, 3, 3, 2, 1], bass: 2, clarity: 3, volume: 0 })).toBe(true)
    expect(s.set('equalizer', { on: true, preset: 'geral', bands: [99, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: 0, clarity: 0 })).toBe(false)
    expect(s.set('equalizer', 'alto')).toBe(false)
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
    expect(s.set('librarySort', 'aleatorio')).toBe(false)
    expect(data()).toEqual({})
  })
})
