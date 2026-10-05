import { describe, it, expect } from 'vitest'
import ico from './ico.js'

// Imagens falsas: só os bytes importam para o formato .ico
const png = (n, fill) => Buffer.alloc(n, fill)

describe('pngsToIco: junta PNGs de vários tamanhos num .ico do Windows', () => {
  const out = ico.pngsToIco([{ size: 16, data: png(10, 1) }, { size: 256, data: png(20, 2) }])
  it('cabeçalho: tipo ícone (1) e quantas imagens', () => {
    expect(out.readUInt16LE(0)).toBe(0)
    expect(out.readUInt16LE(2)).toBe(1)
    expect(out.readUInt16LE(4)).toBe(2)
  })
  it('cada entrada diz o tamanho (256 vira 0), 32 bits por pixel, bytes e onde começa', () => {
    const e1 = 6, e2 = 6 + 16
    expect(out[e1]).toBe(16)
    expect(out[e2]).toBe(0) // 256 px
    expect(out.readUInt16LE(e1 + 6)).toBe(32)
    expect(out.readUInt32LE(e1 + 8)).toBe(10)
    expect(out.readUInt32LE(e1 + 12)).toBe(6 + 16 * 2)
    expect(out.readUInt32LE(e2 + 12)).toBe(6 + 16 * 2 + 10)
  })
  it('as imagens vêm em seguida, na ordem', () => {
    expect(out.length).toBe(6 + 32 + 30)
    expect(out[38]).toBe(1)
    expect(out[48]).toBe(2)
  })
  it('tamanho fora de 1..256: erro', () => {
    expect(() => ico.pngsToIco([{ size: 512, data: png(1, 0) }])).toThrow()
  })
})
