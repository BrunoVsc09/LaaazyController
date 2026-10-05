import { describe, it, expect } from 'vitest'
import mod from './processes.js'

describe('não fecha quem abriu o Laaazy (fechar com /T levaria o Laaazy junto)', () => {
  // terminal (pid 10) → pnpm (20) → electron/Laaazy (30)
  const table = [{ pid: 10, ppid: 4 }, { pid: 20, ppid: 10 }, { pid: 30, ppid: 20 }, { pid: 99, ppid: 10 }]
  it('ancestorsOf: pai, avô... até o fim da cadeia', () => {
    expect(mod.ancestorsOf(table, 30)).toEqual([20, 10, 4])
    expect(mod.ancestorsOf([], 30)).toEqual([])
  })
  it('ancestorsOf: cadeia com laço não trava', () => {
    expect(mod.ancestorsOf([{ pid: 1, ppid: 2 }, { pid: 2, ppid: 1 }], 1)).toEqual([2])
  })
  it('PS com o terminal do "pnpm app" na frente: não fecha (ele é pai do Laaazy)', () => {
    expect(mod.shouldClose({ pid: 10, name: 'WindowsTerminal' }, { selfPid: 30, ownPids: [], ancestorPids: [20, 10, 4] })).toBe(false)
    expect(mod.shouldClose({ pid: 99, name: 'notepad' }, { selfPid: 30, ownPids: [], ancestorPids: [20, 10, 4] })).toBe(true)
  })
})

describe('parseProcessTable: saída do PowerShell (pid e pid do pai por linha)', () => {
  it('lê as linhas e ignora lixo', () => {
    expect(mod.parseProcessTable('10 4\r\n20 10\n\nlixo\n30 20 extra\n')).toEqual([{ pid: 10, ppid: 4 }, { pid: 20, ppid: 10 }, { pid: 30, ppid: 20 }])
    expect(mod.parseProcessTable('')).toEqual([])
  })
})
