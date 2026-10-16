import { describe, it, expect, vi } from 'vitest'
import mod from './pad-status.js'

// Laaazy-pad falso: responde o tempo parado e a bateria que o teste mandar
function make({ idle = 30, battery = '60 descarregando', exe = 'C:\\P\\LaaazyPad.exe', focused = true, minutes = 10 } = {}) {
  const state = { idle, battery }
  const cli = {
    queryIdle: vi.fn(async () => state.idle),
    queryBattery: vi.fn(async () => state.battery),
    setIdle: vi.fn(async () => ''),
  }
  const send = vi.fn()
  const notify = vi.fn()
  let t = 0
  const s = mod.createPadStatus({ cli, getExe: async () => exe, minutes: () => minutes, send, notify, focused: () => focused, now: () => t })
  return { s, cli, send, notify, state, advance: (ms) => { t += ms } }
}

describe('pad-status: bateria e tempo do controle (Laaazy-pad)', () => {
  it('manda a bateria para a tela a cada leitura', async () => {
    const { s, send } = make()
    await s.tick()
    expect(send).toHaveBeenCalledWith({ battery: { percent: 60, state: 'descarregando' }, alert: '' })
  })
  it('Laaazy-pad acabou de abrir (ou o Laaazy acabou de abrir): manda o tempo escolhido uma vez', async () => {
    const { s, cli, state } = make({ minutes: 15 })
    await s.tick()
    await s.tick()
    expect(cli.setIdle).toHaveBeenCalledTimes(1)
    expect(cli.setIdle).toHaveBeenCalledWith('C:\\P\\LaaazyPad.exe', 15)
    state.idle = null // fechou
    await s.tick()
    state.idle = 0 // abriu de novo: ele começa em 10 min, então manda de novo
    await s.tick()
    expect(cli.setIdle).toHaveBeenCalledTimes(2)
  })
  it('fechado: sem bateria e sem tempo parado', async () => {
    const { s, send, cli } = make({ idle: null })
    await s.tick()
    expect(cli.queryBattery).not.toHaveBeenCalled()
    expect(send).toHaveBeenCalledWith({ battery: null, alert: '' })
    expect(s.idleNow()).toBeNull()
  })
  it('tempo parado anda sozinho entre as leituras', async () => {
    const { s, advance } = make({ idle: 100 })
    await s.tick()
    advance(4000)
    expect(s.idleNow()).toBe(104)
  })
  it('bateria baixa com o Laaazy na frente: faixa na tela, sem notificação do Windows', async () => {
    const { s, send, notify } = make({ battery: '20 descarregando' })
    await s.tick()
    expect(send).toHaveBeenLastCalledWith({ battery: { percent: 20, state: 'descarregando' }, alert: 'Bateria do controle em 20%. Conecte o cabo quando puder.' })
    expect(notify).not.toHaveBeenCalled()
    await s.tick()
    expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ alert: '' })) // uma vez só
  })
  it('bateria baixa com jogo ou Edge na frente: notificação do Windows', async () => {
    const { s, notify } = make({ battery: '10 descarregando', focused: false })
    await s.tick()
    expect(notify).toHaveBeenCalledWith('Bateria do controle em 10%: conecte o cabo para não desligar.')
  })
  it('trocou o tempo nas Configurações: manda na hora (se o Laaazy-pad estiver aberto)', async () => {
    const { s, cli, state } = make()
    await s.setMinutes(30)
    expect(cli.setIdle).not.toHaveBeenCalled() // ainda não viu o Laaazy-pad aberto
    await s.tick()
    await s.setMinutes(30)
    expect(cli.setIdle).toHaveBeenLastCalledWith('C:\\P\\LaaazyPad.exe', 30)
    state.idle = null
    await s.tick()
    cli.setIdle.mockClear()
    await s.setMinutes(5)
    expect(cli.setIdle).not.toHaveBeenCalled()
  })
  it('sem Laaazy-pad instalado: nada quebra', async () => {
    const { s, send, cli } = make({ exe: null })
    await s.tick()
    expect(cli.queryIdle).not.toHaveBeenCalled()
    expect(send).toHaveBeenCalledWith({ battery: null, alert: '' })
  })
  it('uma leitura por vez (o tick seguinte não atropela o anterior)', async () => {
    const { s, cli } = make()
    await Promise.all([s.tick(), s.tick()])
    expect(cli.queryIdle).toHaveBeenCalledTimes(1)
  })
})
