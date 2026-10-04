import { describe, it, expect, vi } from 'vitest'
import mod from './return-watch.js'

function make(sequence) {
  let t = 0
  const infos = [...sequence]
  const deps = {
    fgInfo: vi.fn(async () => infos.shift() || { name: 'explorer', pid: 1 }),
    ownPids: () => [10], selfPid: 10,
    onReturn: vi.fn(),
    now: () => t,
  }
  return { w: mod.createReturnWatch(deps), deps, advance: (ms) => { t += ms } }
}

describe('return-watch', () => {
  it('parado não pergunta nada ao Windows', async () => {
    const { w, deps } = make([])
    await w.tick()
    expect(deps.fgInfo).not.toHaveBeenCalled()
  })
  it('depois de abrir algo, volta ao Laaazy quando esse algo fecha', async () => {
    const { w, deps, advance } = make([{ name: 'Hades', pid: 99 }, { name: 'Hades', pid: 99 }, { name: 'explorer', pid: 5 }])
    w.start()
    advance(1000); await w.tick()
    advance(1000); await w.tick()
    expect(deps.onReturn).not.toHaveBeenCalled()
    advance(1000); await w.tick()
    expect(deps.onReturn).toHaveBeenCalledTimes(1)
    await w.tick()
    expect(deps.onReturn).toHaveBeenCalledTimes(1)
  })
  it('stop para de vigiar', async () => {
    const { w, deps } = make([{ name: 'Hades', pid: 99 }])
    w.start(); w.stop()
    await w.tick()
    expect(deps.fgInfo).not.toHaveBeenCalled()
  })
})
