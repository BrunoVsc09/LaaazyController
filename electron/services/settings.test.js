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
    expect(s.set('ds4Path', 'C:\\DS4')).toBe(true)
    expect(data()).toEqual({ edgePath: 'C:\\E', ds4Path: 'C:\\DS4' })
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
  it('recusa chave desconhecida e valor do tipo errado', () => {
    const { s, data } = make()
    expect(s.set('hacker', 1)).toBe(false)
    expect(s.set('closeDs4OnMenu', 'sim')).toBe(false)
    expect(s.set('librarySort', 'aleatorio')).toBe(false)
    expect(data()).toEqual({})
  })
})
