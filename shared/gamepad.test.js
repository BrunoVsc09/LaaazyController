import { describe, it, expect } from 'vitest'
import gp from './gamepad.js'

const pad = (pressed = [], axes = [0, 0, 0, 0]) => ({
  buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i) })),
  axes,
})

describe('createEdges', () => {
  it('dispara só no instante em que o botão é apertado', () => {
    const update = gp.createEdges()
    expect(update(pad([0]))(0)).toBe(true)
    expect(update(pad([0]))(0)).toBe(false) // segurando
    expect(update(pad([]))(0)).toBe(false)  // soltou
    expect(update(pad([0]))(0)).toBe(true)  // apertou de novo
  })
  // B2: `edge(9) || edge(16)` não atualizava o 16 quando o 9 disparava → disparo duplo depois
  it('B2: Options e PS juntos disparam uma vez só, e segurar não dispara de novo', () => {
    const update = gp.createEdges()
    const f1 = update(pad([9, 16]))
    expect(f1(9) || f1(16)).toBe(true)
    const f2 = update(pad([9, 16]))
    expect(f2(9) || f2(16)).toBe(false)
  })
  it('pad sem botões não quebra', () => {
    expect(gp.createEdges()({ buttons: [] })(0)).toBe(false)
  })
})

describe('direction', () => {
  it('D-pad', () => {
    expect(gp.direction(pad([15]))).toEqual({ dx: 1, dy: 0 })
    expect(gp.direction(pad([14]))).toEqual({ dx: -1, dy: 0 })
    expect(gp.direction(pad([12]))).toEqual({ dx: 0, dy: -1 })
    expect(gp.direction(pad([13]))).toEqual({ dx: 0, dy: 1 })
  })
  it('analógico só conta depois da zona morta', () => {
    expect(gp.direction(pad([], [0.7, 0]))).toEqual({ dx: 1, dy: 0 })
    expect(gp.direction(pad([], [0.5, -0.5]))).toEqual({ dx: 0, dy: 0 })
    expect(gp.direction(pad([], [0, -0.9]))).toEqual({ dx: 0, dy: -1 })
  })
})

describe('dpadDirection e stickDirection (separados: o analógico pode estar virando mouse)', () => {
  it('D-pad sozinho', () => {
    expect(gp.dpadDirection(pad([15]))).toEqual({ dx: 1, dy: 0 })
    expect(gp.dpadDirection(pad([], [0.9, 0]))).toEqual({ dx: 0, dy: 0 })
  })
  it('analógico sozinho', () => {
    expect(gp.stickDirection(pad([], [0, 0.9]))).toEqual({ dx: 0, dy: 1 })
    expect(gp.stickDirection(pad([15]))).toEqual({ dx: 0, dy: 0 })
  })
  it('algum botão apertado (inclui D-pad; analógico não conta)', () => {
    expect(gp.anyButton(pad([0]))).toBe(true)
    expect(gp.anyButton(pad([], [1, 1]))).toBe(false)
  })
})

describe('pickNext (navegação espacial)', () => {
  // grade 2x2 de 100x100 com 20px de espaço
  const r = (left, top) => ({ left, top, width: 100, height: 100 })
  const grid = [r(0, 0), r(120, 0), r(0, 120), r(120, 120)]
  it('sem foco atual, vai para o primeiro', () => {
    expect(gp.pickNext(grid, -1, 1, 0)).toBe(0)
    expect(gp.pickNext([], -1, 1, 0)).toBe(-1)
  })
  it('anda na direção pedida', () => {
    expect(gp.pickNext(grid, 0, 1, 0)).toBe(1)
    expect(gp.pickNext(grid, 0, 0, 1)).toBe(2)
    expect(gp.pickNext(grid, 3, -1, 0)).toBe(2)
    expect(gp.pickNext(grid, 3, 0, -1)).toBe(1)
  })
  it('na borda, fica onde está', () => {
    expect(gp.pickNext(grid, 1, 1, 0)).toBe(1)
  })
  it('prefere o alinhado ao mais próximo na diagonal', () => {
    const rects = [r(0, 0), r(150, 30), r(300, 0)]
    expect(gp.pickNext(rects, 0, 1, 0)).toBe(1)
    const far = [r(0, 0), r(130, 300), r(300, 0)]
    expect(gp.pickNext(far, 0, 1, 0)).toBe(2)
  })
})
