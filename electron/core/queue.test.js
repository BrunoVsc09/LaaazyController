import { describe, it, expect } from 'vitest'
import mod from './queue.js'

const { createQueue } = mod
const deferred = () => { let resolve; const p = new Promise((r) => { resolve = r }); return { p, resolve } }

describe('queue', () => {
  it('roda uma tarefa por vez, na ordem', async () => {
    const q = createQueue({ timeoutMs: 1000, onTimeout: () => 'tempo' })
    const log = []
    const a = deferred()
    const r1 = q.run(async () => { log.push('a início'); await a.p; log.push('a fim'); return 1 })
    const r2 = q.run(async () => { log.push('b'); return 2 })
    await new Promise((r) => setTimeout(r, 5))
    expect(log).toEqual(['a início'])
    a.resolve()
    expect(await r1).toBe(1)
    expect(await r2).toBe(2)
    expect(log).toEqual(['a início', 'a fim', 'b'])
  })
  it('tarefa presa é cancelada no tempo limite e a fila continua', async () => {
    const q = createQueue({ timeoutMs: 10, onTimeout: () => 'tempo' })
    const r1 = q.run(() => new Promise(() => {}))
    const r2 = q.run(async () => 'depois')
    expect(await r1).toBe('tempo')
    expect(await r2).toBe('depois')
  })
  it('erro numa tarefa não trava as próximas', async () => {
    const q = createQueue({ timeoutMs: 1000, onTimeout: () => null })
    await expect(q.run(async () => { throw new Error('x') })).rejects.toThrow('x')
    expect(await q.run(async () => 'ok')).toBe('ok')
  })
})
