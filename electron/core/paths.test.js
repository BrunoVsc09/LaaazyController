import { describe, it, expect } from 'vitest'
import paths from './paths.js'

const { resolveExeIn } = paths
const fakeFs = (...files) => (p) => files.includes(p)

describe('resolveExeIn', () => {
  it('vazio devolve null', () => {
    expect(resolveExeIn('', 'msedge.exe', fakeFs())).toBeNull()
  })
  it('caminho direto para o .exe existente', () => {
    expect(resolveExeIn('C:\\E\\msedge.exe', 'msedge.exe', fakeFs('C:\\E\\msedge.exe'))).toBe('C:\\E\\msedge.exe')
  })
  it('caminho direto para .exe que não existe devolve null', () => {
    expect(resolveExeIn('C:\\E\\msedge.exe', 'msedge.exe', fakeFs())).toBeNull()
  })
  it('acha o .exe na pasta, na subpasta Application ou na pasta de cima', () => {
    expect(resolveExeIn('C:\\E', 'msedge.exe', fakeFs('C:\\E\\msedge.exe'))).toBe('C:\\E\\msedge.exe')
    expect(resolveExeIn('C:\\E', 'msedge.exe', fakeFs('C:\\E\\Application\\msedge.exe'))).toBe('C:\\E\\Application\\msedge.exe')
    expect(resolveExeIn('C:\\E\\Sub', 'msedge.exe', fakeFs('C:\\E\\msedge.exe'))).toBe('C:\\E\\msedge.exe')
  })
  it('pasta sem o .exe devolve null', () => {
    expect(resolveExeIn('C:\\Outra', 'msedge.exe', fakeFs('C:\\E\\msedge.exe'))).toBeNull()
  })
})
