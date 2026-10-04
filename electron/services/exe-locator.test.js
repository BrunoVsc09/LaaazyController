import { describe, it, expect, vi } from 'vitest'
import mod from './exe-locator.js'

const env = { USERPROFILE: 'C:\\Users\\ana', LOCALAPPDATA: 'C:\\Users\\ana\\AppData\\Local', ProgramFiles: 'C:\\Program Files', 'ProgramFiles(x86)': 'C:\\Program Files (x86)' }

function make({ files = [], saved = {}, reg = null, chosen = null } = {}) {
  const store = { ...saved }
  const settings = { get: (k) => store[k], set: vi.fn((k, v) => { store[k] = v; return true }) }
  const showError = vi.fn()
  const loc = mod.createExeLocator({
    settings, env, showError,
    exists: (p) => files.includes(p),
    regAppPath: async () => reg,
    chooseDir: async () => chosen,
  })
  return { loc, settings, showError, store }
}

describe('exe-locator', () => {
  it('usa primeiro o caminho salvo', async () => {
    const { loc } = make({ files: ['D:\\Edge\\msedge.exe'], saved: { edgePath: 'D:\\Edge' } })
    expect(await loc.find('edge')).toBe('D:\\Edge\\msedge.exe')
  })
  it('depois os caminhos padrão', async () => {
    const { loc } = make({ files: ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'] })
    expect(await loc.find('chrome')).toBe('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  })
  it('depois o registro do Windows', async () => {
    const { loc } = make({ files: ['E:\\ff\\firefox.exe'], reg: 'E:\\ff\\firefox.exe' })
    expect(await loc.find('firefox')).toBe('E:\\ff\\firefox.exe')
  })
  it('não achou em lugar nenhum devolve null', async () => {
    expect(await make().loc.find('edge')).toBeNull()
  })
  it('programa desconhecido devolve null', async () => {
    expect(await make().loc.find('notepad')).toBeNull()
  })

  // B3: o caminho do DS4Windows era fixo em C:\\Users\\bruno\\Downloads\\win-x64
  it('B3: DS4Windows vem do caminho salvo (ds4Path)', async () => {
    const { loc } = make({ files: ['F:\\DS4\\DS4Windows.exe'], saved: { ds4Path: 'F:\\DS4' } })
    expect(await loc.find('ds4windows')).toBe('F:\\DS4\\DS4Windows.exe')
  })
  it('B3: o padrão do DS4Windows usa a pasta Downloads do usuário atual, não a de um usuário fixo', async () => {
    const { loc } = make({ files: ['C:\\Users\\ana\\Downloads\\win-x64\\DS4Windows.exe'] })
    expect(await loc.find('ds4windows')).toBe('C:\\Users\\ana\\Downloads\\win-x64\\DS4Windows.exe')
  })
  it('variável de ambiente ausente não vira caminho relativo', async () => {
    const loc = mod.createExeLocator({ settings: { get: () => undefined }, env: {}, exists: (p) => p === 'Programs\\Hydra\\Hydra.exe', regAppPath: async () => null })
    expect(await loc.find('hydra')).toBeNull()
  })

  it('choose: pasta certa é salva e devolve o .exe', async () => {
    const { loc, store } = make({ files: ['G:\\Edge\\Application\\msedge.exe'], chosen: 'G:\\Edge' })
    expect(await loc.choose('edge')).toBe('G:\\Edge\\Application\\msedge.exe')
    expect(store.edgePath).toBe('G:\\Edge')
  })
  it('choose: pasta errada mostra erro e não salva', async () => {
    const { loc, settings, showError } = make({ chosen: 'G:\\Nada' })
    expect(await loc.choose('edge')).toBeNull()
    expect(showError).toHaveBeenCalled()
    expect(settings.set).not.toHaveBeenCalled()
  })
  it('choose: cancelado devolve null sem erro', async () => {
    const { loc, showError } = make()
    expect(await loc.choose('edge')).toBeNull()
    expect(showError).not.toHaveBeenCalled()
  })
  it('findOrChoose pergunta só quando não acha', async () => {
    const { loc } = make({ files: ['G:\\Edge\\msedge.exe'], chosen: 'G:\\Edge' })
    expect(await loc.findOrChoose('edge')).toBe('G:\\Edge\\msedge.exe')
  })
})
