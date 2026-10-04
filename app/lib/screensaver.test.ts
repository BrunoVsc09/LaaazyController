import { describe, it, expect } from 'vitest'
import { createIdle, slidesFrom, nextMinutes, padActive, SAVER_OPTIONS } from './screensaver'

describe('createIdle', () => {
  it('fica ocioso depois do tempo sem atividade; atividade zera', () => {
    let t = 0
    const idle = createIdle(() => t)
    expect(idle.isIdle(5)).toBe(false)
    t = 5 * 60_000
    expect(idle.isIdle(5)).toBe(true)
    idle.touch()
    expect(idle.isIdle(5)).toBe(false)
  })
  it('0 minutos = desligada', () => {
    let t = 0
    const idle = createIdle(() => t)
    t = 99 * 60_000
    expect(idle.isIdle(0)).toBe(false)
  })
})

describe('slidesFrom', () => {
  it('imagens de fundo, sem repetir e sem vazias', () => {
    const x = (id: string, backdrop: string) => ({ id, title: id, backdrop })
    expect(slidesFrom([x('a', 'u1'), x('b', ''), x('c', 'u1'), x('d', 'u2')])).toEqual([{ title: 'a', image: 'u1' }, { title: 'd', image: 'u2' }])
  })
})

describe('nextMinutes', () => {
  it('cicla Desligada → 5 → 10 → 15 → 30 → Desligada', () => {
    expect(SAVER_OPTIONS).toEqual([0, 5, 10, 15, 30])
    expect(nextMinutes(0)).toBe(5)
    expect(nextMinutes(30)).toBe(0)
    expect(nextMinutes(7)).toBe(0) // valor estranho volta ao começo
  })
})

describe('padActive', () => {
  it('algum botão apertado ou analógico fora da zona morta', () => {
    const pad = (pressed: number[], axes = [0, 0, 0, 0]) => ({ buttons: [0, 1, 2].map((i) => ({ pressed: pressed.includes(i) })), axes })
    expect(padActive(pad([]))).toBe(false)
    expect(padActive(pad([1]))).toBe(true)
    expect(padActive(pad([], [0, 0, 0.1, 0]))).toBe(false)
    expect(padActive(pad([], [0, 0, 0.6, 0]))).toBe(true)
  })
})
