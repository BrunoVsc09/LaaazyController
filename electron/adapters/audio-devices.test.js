import { describe, it, expect } from 'vitest'
import mod from './audio-devices.js'

// Saídas de som do Windows: PowerShell com C# (Core Audio). O Windows não tem forma oficial de trocar a
// saída padrão; a interface interna IPolicyConfig é a que SoundSwitch e EarTrumpet usam
const ID = '{0.0.0.00000000}.{6c1b8f2e-1d0a-4c1e-9d55-0d2f6b9a7e11}'

describe('audio-devices: scripts do PowerShell', () => {
  it('listar: nomes com acento saem em UTF-8 e só as saídas ativas', () => {
    const s = mod.listScript()
    expect(s).toContain('[Console]::OutputEncoding = [Text.Encoding]::UTF8')
    expect(s).toContain('[LaaazyAudio.Outputs]::List()')
  })
  it('trocar: manda o id certo para a troca da saída padrão', () => {
    expect(mod.setScript(ID)).toContain(`exit [LaaazyAudio.Outputs]::SetDefault('${ID}')`)
  })
  it.each([
    ['vazio', ''],
    ['com aspas (tentativa de injetar comando)', "{0.0.0.00000000}.{x}'; Remove-Item C:\\ -Recurse; '"],
    ['formato estranho', 'qualquer coisa'],
    ['não é texto', 42],
  ])('recusa id %s (nem chega ao PowerShell)', (_n, id) => {
    expect(mod.setScript(id)).toBe(null)
  })
})
