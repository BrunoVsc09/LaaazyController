import { describe, it, expect, vi } from 'vitest'
import mod from './idle-shutdown.js'

const H = 3600

// Relógio falso: o teste diz quanto tempo o Windows e o controle estão parados
function make({ hours = 4, system = 0, pad = 0, focused = true } = {}) {
  const t = { hours, system, pad }
  const send = vi.fn()
  const notify = vi.fn()
  const shutdown = vi.fn(async () => '')
  const blocker = { start: vi.fn(), stop: vi.fn() }
  const s = mod.createIdleShutdown({
    hours: () => t.hours, systemIdle: () => t.system, padIdle: () => t.pad,
    shutdown, send, notify, focused: () => focused, blocker,
  })
  const parado = (seconds) => { t.system = seconds; t.pad = seconds }
  return { s, t, send, notify, shutdown, blocker, parado }
}

describe('idle-shutdown: desligar o PC sem uso', () => {
  it('4 h sem teclado, mouse e controle: aviso de 60 s na tela', async () => {
    const { s, send, notify, parado } = make()
    parado(4 * H)
    await s.tick()
    expect(send).toHaveBeenCalledWith({ seconds: 60 })
    expect(notify).not.toHaveBeenCalled()
  })
  it('jogando só com o controle: não desliga', async () => {
    const { s, t, send } = make({ system: 5 * H, pad: 10 })
    await s.tick()
    expect(send).not.toHaveBeenCalled()
    t.pad = null // Laaazy-pad fechado: vale só o teclado e o mouse
    await s.tick()
    expect(send).toHaveBeenCalledWith({ seconds: 60 })
  })
  it('Laaazy escondido (filme no Edge): o aviso vira notificação do Windows', async () => {
    const { s, notify, parado } = make({ focused: false })
    parado(4 * H)
    await s.tick()
    expect(notify).toHaveBeenCalledWith('O PC vai desligar em 1 minuto por falta de uso. Mexa no controle, no mouse ou no teclado para cancelar.')
  })
  it('conta os segundos e desliga no fim, sem forçar', async () => {
    const { s, send, shutdown, parado } = make()
    parado(4 * H)
    await s.tick()
    parado(4 * H + 30)
    await s.tick()
    expect(send).toHaveBeenLastCalledWith({ seconds: 30 })
    parado(4 * H + 60)
    await s.tick()
    expect(send).toHaveBeenLastCalledWith({ seconds: 0 })
    expect(shutdown).toHaveBeenCalledTimes(1)
  })
  it('mexeu no controle durante o aviso: cancela e tira o aviso', async () => {
    const { s, t, send, shutdown, parado } = make()
    parado(4 * H)
    await s.tick()
    t.pad = 1
    await s.tick()
    expect(send).toHaveBeenLastCalledWith({ seconds: 0 })
    parado(4 * H + 60)
    t.pad = 1
    await s.tick()
    expect(shutdown).not.toHaveBeenCalled()
  })
  it('o Windows não desligou (programa com coisa sem salvar): só tenta de novo depois de alguém usar', async () => {
    const { s, send, shutdown, parado } = make()
    parado(4 * H); await s.tick()
    parado(4 * H + 60); await s.tick()
    send.mockClear()
    parado(4 * H + 200); await s.tick()
    expect(send).not.toHaveBeenCalled()
    expect(shutdown).toHaveBeenCalledTimes(1)
    parado(5); await s.tick() // alguém voltou
    parado(4 * H); await s.tick()
    expect(send).toHaveBeenCalledWith({ seconds: 60 })
  })
  it('opção ligada: o Windows não suspende antes; Nunca: o Windows volta a mandar', async () => {
    const { s, t, blocker } = make({ hours: 4 })
    await s.tick()
    await s.tick()
    expect(blocker.start).toHaveBeenCalledTimes(1)
    t.hours = 0
    await s.tick()
    expect(blocker.stop).toHaveBeenCalledTimes(1)
  })
  it('Nunca: não avisa nem bloqueia a suspensão', async () => {
    const { s, send, blocker, parado } = make({ hours: 0 })
    parado(99 * H)
    await s.tick()
    expect(send).not.toHaveBeenCalled()
    expect(blocker.start).not.toHaveBeenCalled()
  })
})
