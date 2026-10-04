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
  it('recusa chave desconhecida e valor do tipo errado', () => {
    const { s, data } = make()
    expect(s.set('hacker', 1)).toBe(false)
    expect(s.set('closeDs4OnMenu', 'sim')).toBe(false)
    expect(s.set('librarySort', 'aleatorio')).toBe(false)
    expect(data()).toEqual({})
  })
})
