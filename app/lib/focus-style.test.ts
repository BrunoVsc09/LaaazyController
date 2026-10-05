import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const css = fs.readFileSync(path.join(__dirname, '..', 'globals.css'), 'utf8')

// Regressão: o anel de foco usava :focus-visible, que o Chrome esconde depois que o mouse
// (ou o controle no perfil PC do DS4Windows) é usado. Aí a borda sumia e não dava para ver onde estava.
describe('anel de foco', () => {
  it('existe uma regra de foco que vale sempre (:focus), em todas as telas e janelas do app', () => {
    expect(css).toMatch(/:is\(\.ps4-screen, \.kb-overlay\) :is\(button, input, a, \[tabindex\]\):focus \{[^}]*outline: 3px solid #ffd23f/)
  })
  it('nenhuma regra apaga o contorno de algo focado', () => {
    expect(css).not.toMatch(/:focus(-visible)? \{ outline: none; \}/)
  })
})
