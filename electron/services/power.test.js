import { describe, it, expect, vi } from 'vitest'
import mod from './power.js'

const T = new Date(2026, 9, 5, 21, 30).getTime()
function make() {
  const deps = { exec: vi.fn(async () => ''), quit: vi.fn(), setLogin: vi.fn(() => true), getLogin: vi.fn(() => false), now: () => T }
  return { power: mod.createPower(deps), deps }
}

describe('power service', () => {
  it('fechar o app não pede confirmação', async () => {
    const { power, deps } = make()
    expect(await power.run('quit')).toEqual({ ok: true })
    expect(deps.quit).toHaveBeenCalled()
  })
  it('desligar sem confirmação só pede confirmação, não executa', async () => {
    const { power, deps } = make()
    expect(await power.run('shutdown')).toEqual({ ok: false, confirm: true, msg: 'Você tem certeza que quer desligar o PC agora?' })
    expect(deps.exec).not.toHaveBeenCalled()
  })
  it('desligar confirmado executa o comando do Windows', async () => {
    const { power, deps } = make()
    expect(await power.run('shutdown', true)).toEqual({ ok: true })
    expect(deps.exec).toHaveBeenCalledWith('shutdown', ['/s', '/t', '0'])
  })
  it('suspender confirmado', async () => {
    const { power, deps } = make()
    await power.run('suspend', true)
    expect(deps.exec).toHaveBeenCalledWith('rundll32.exe', ['powrprof.dll,SetSuspendState', '0', '1', '0'])
  })
  it('cada ação pergunta "você tem certeza?" com o horário quando é agendado', async () => {
    const { power } = make()
    expect((await power.run('suspend')).msg).toBe('Você tem certeza que quer suspender o PC?')
    expect((await power.run('shutdown_3h')).msg).toBe('Você tem certeza que quer desligar o PC daqui a 3 horas (às 00:30)?')
    expect((await power.run('shutdown_2h')).msg).toBe('Você tem certeza que quer desligar o PC daqui a 2 horas (às 23:30)?')
    expect((await power.run('shutdown_cancel')).msg).toBe('Você tem certeza que quer cancelar o desligamento agendado?')
  })
  it('agendar: cancela um agendamento anterior (se houver) e agenda o novo; avisa a hora', async () => {
    const { power, deps } = make()
    deps.exec.mockResolvedValueOnce('nada agendado').mockResolvedValueOnce('')
    expect(await power.run('shutdown_3h', true)).toEqual({ ok: true, msg: 'O PC vai desligar às 00:30. Para desistir: Energia → Cancelar o desligamento.' })
    expect(deps.exec.mock.calls).toEqual([['shutdown', ['/a']], ['shutdown', ['/s', '/t', '10800']]])
  })
  it('cancelar o desligamento', async () => {
    const { power, deps } = make()
    expect(await power.run('shutdown_cancel', true)).toEqual({ ok: true, msg: 'Desligamento cancelado.' })
    deps.exec.mockResolvedValue('erro 1116')
    expect(await power.run('shutdown_cancel', true)).toEqual({ ok: false, msg: 'Não havia nenhum desligamento agendado.' })
  })
  it('erro do comando vira mensagem', async () => {
    const { power, deps } = make()
    deps.exec.mockResolvedValue('Acesso negado')
    expect(await power.run('shutdown', true)).toEqual({ ok: false, msg: 'Não consegui: Acesso negado' })
  })
  it('ação desconhecida é recusada', async () => {
    const { power, deps } = make()
    expect((await power.run('format-c', true)).ok).toBe(false)
    expect(deps.exec).not.toHaveBeenCalled()
  })
  it('abrir junto com o Windows', () => {
    const { power, deps } = make()
    expect(power.openAtLogin()).toBe(false)
    power.setOpenAtLogin(true)
    expect(deps.setLogin).toHaveBeenCalledWith(true)
  })
})
