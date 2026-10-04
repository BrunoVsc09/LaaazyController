import { describe, it, expect, vi } from 'vitest'
import mod from './power.js'

function make() {
  const deps = { exec: vi.fn(async () => ''), quit: vi.fn(), setLogin: vi.fn(() => true), getLogin: vi.fn(() => false) }
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
    expect(await power.run('shutdown')).toEqual({ ok: false, confirm: true, msg: 'Confirme para desligar o PC.' })
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
