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
  // Regressão (2026-10-08): o teclado por cima é uma janela do próprio Laaazy; aberto sobre o
  // Edge, a volta automática achava que o usuário tinha voltado e trazia o Início por cima
  it('com o teclado por cima aberto (hold), não volta ao Início; depois de release, volta a vigiar', async () => {
    const { w, deps, advance } = make([{ name: 'msedge', pid: 99 }, { name: 'electron', pid: 10 }, { name: 'msedge', pid: 99 }, { name: 'explorer', pid: 5 }])
    w.start()
    advance(1000); await w.tick() // Edge na frente
    w.hold() // teclado abriu
    advance(1000); await w.tick() // a janela do teclado (do Laaazy) está na frente
    expect(deps.onReturn).not.toHaveBeenCalled()
    w.release() // teclado fechou, o Edge voltou
    advance(1000); await w.tick()
    expect(deps.onReturn).not.toHaveBeenCalled()
    advance(1000); await w.tick() // Edge fechou
    expect(deps.onReturn).toHaveBeenCalledTimes(1)
  })
})

