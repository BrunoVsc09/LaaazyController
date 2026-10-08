import { describe, it, expect, vi } from 'vitest'
import mod from './text-entry.js'

function make({ fg = ['111'] } = {}) {
  const queue = [...fg]
  const deps = {
    fgHwnd: vi.fn(async () => queue.length > 1 ? queue.shift() : queue[0]),
    showOverlay: vi.fn(),
    maskMenu: vi.fn(),
    hideOverlay: vi.fn(),
    sendEdit: vi.fn(() => true),
    profileIn: vi.fn(),
    profileOut: vi.fn(),
  }
  return { t: mod.createTextEntry(deps), deps }
}

describe('teclado por cima de outro programa (texto em tempo real)', () => {
  it('abrir: guarda a janela da frente e mostra o teclado', async () => {
    const { t, deps } = make()
    await t.open()
    expect(deps.fgHwnd).toHaveBeenCalled()
    expect(deps.showOverlay).toHaveBeenCalled()
  })
  // Regressão (2026-10-08, registrado dentro da Crunchyroll): o Ctrl e o Alt do atalho chegam ao
  // Edge; um Alt solto sozinho leva o foco para o menu do navegador e a busca perde a seleção
  it('ao abrir, mascara o Alt do atalho antes de tudo (o Edge não vai para o menu)', async () => {
    const { t, deps } = make()
    await t.open()
    expect(deps.maskMenu.mock.invocationCallOrder[0]).toBeLessThan(deps.fgHwnd.mock.invocationCallOrder[0])
  })
  it('cada tecla vai na hora para o campo do site (apagar N + texto)', async () => {
    const { t, deps } = make()
    await t.open()
    expect(await t.edit(0, 'n')).toBe(true)
    expect(await t.edit(1, '')).toBe(true)
    expect(deps.sendEdit.mock.calls).toEqual([[{ back: 0, text: 'n' }], [{ back: 1, text: '' }]])
    expect(deps.hideOverlay).not.toHaveBeenCalled()
  })
  it('teclas rápidas chegam em ordem, mesmo se a consulta ao Windows demorar', async () => {
    const { t, deps } = make()
    await t.open()
    let slow = true
    deps.fgHwnd.mockImplementation(async () => { if (slow) { slow = false; await new Promise((r) => setTimeout(r, 20)) } return '111' })
    await Promise.all([t.edit(0, 'a'), t.edit(0, 'b'), t.edit(0, 'c')])
    expect(deps.sendEdit.mock.calls.map((c) => c[0].text).join('')).toBe('abc')
  })
  it('outra janela na frente (você trocou de programa): não digita nela', async () => {
    const { t, deps } = make({ fg: ['111', '999'] })
    await t.open()
    expect(await t.edit(0, 'x')).toBe(false)
    expect(deps.sendEdit).not.toHaveBeenCalled()
  })
  it('teclado fechado ou valores estranhos: não digita', async () => {
    const { t, deps } = make()
    expect(await t.edit(0, 'x')).toBe(false) // nem abriu
    await t.open()
    expect(await t.edit(-1, '')).toBe(false)
    expect(await t.edit(0, 'a\nb')).toBe(false)
    expect(await t.edit(0, 'x'.repeat(501))).toBe(false)
    expect(deps.sendEdit).not.toHaveBeenCalled()
  })
  // Ideia do Bruno (2026-10-08): no perfil PC o controle vira mouse e atrapalhava o teclado;
  // com o teclado aberto, o controle fica num perfil sem mouse (Brunera) e volta ao fechar
  it('abrir troca o controle para o perfil do teclado; fechar devolve o perfil de antes', async () => {
    const { t, deps } = make()
    await t.open()
    expect(deps.profileIn).toHaveBeenCalledTimes(1)
    expect(deps.profileOut).not.toHaveBeenCalled()
    t.close()
    expect(deps.profileOut).toHaveBeenCalledTimes(1)
  })
  it('fechar sem ter aberto não mexe no perfil', () => {
    const { t, deps } = make()
    t.close()
    expect(deps.profileOut).not.toHaveBeenCalled()
  })
  it('fechar (Pronto, O ou Cancelar): esconde e para de digitar', async () => {
    const { t, deps } = make()
    await t.open()
    t.close()
    expect(deps.hideOverlay).toHaveBeenCalled()
    expect(await t.edit(0, 'x')).toBe(false)
  })
})
