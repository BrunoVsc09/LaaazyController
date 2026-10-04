import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import mod from './inline-shared.js'

const files = {
  'C:/p/shared/channels.js': "module.exports = { OPEN: 'open' }",
  'C:/p/shared/gamepad.js': 'const x = 2\nmodule.exports = { dobro: (n) => n * x }',
}
const read = (p) => {
  const key = p.replace(/\\/g, '/')
  if (!(key in files)) throw new Error('não existe: ' + key)
  return files[key]
}

describe('inlineShared', () => {
  it('troca require("../shared/x") pelo conteúdo do arquivo, isolado', () => {
    const src = "const C = require('../shared/channels')\nconst g = require('../shared/gamepad')\nresult = C.OPEN + g.dobro(21)"
    const out = mod.inlineShared(src, 'C:/p/electron', read)
    expect(out).not.toMatch(/require\('\.\.\/shared/)
    const ctx = { result: null }
    vm.runInNewContext(out, ctx)
    expect(ctx.result).toBe('open42')
  })
  it('mantém os outros requires (electron)', () => {
    const src = "const { ipcRenderer } = require('electron')"
    expect(mod.inlineShared(src, 'C:/p/electron', read)).toBe(src)
  })
  it('arquivo compartilhado inexistente falha alto', () => {
    expect(() => mod.inlineShared("require('../shared/nada')", 'C:/p/electron', read)).toThrow(/não existe/)
  })
})
