import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const themes = fs.readFileSync(path.join(__dirname, '..', 'themes.css'), 'utf8')
const globals = fs.readFileSync(path.join(__dirname, '..', 'globals.css'), 'utf8')
const layout = fs.readFileSync(path.join(__dirname, '..', 'layout.tsx'), 'utf8')

// Cor do Laaazy (pedido do Bruno, 2026-10-09): o azul de hoje é o padrão; os outros só trocam cores
describe('temas de cor no CSS', () => {
  it('o arquivo dos temas é carregado pela página', () => {
    expect(layout).toContain("import './themes.css'")
  })
  it('o efeito do fundo lê as cores de variáveis, com o azul de hoje como padrão', () => {
    expect(globals).toMatch(/rgb\(var\(--fx-glow, 80 170 255\) \/ 0\.38\)/)
    expect(globals).toMatch(/rgb\(var\(--fx-wave, 64 160 255\) \/ 0\.42\)/)
    expect(globals).toMatch(/radial-gradient\(circle, var\(--fx-dust, #eaf7ff\) 0%, var\(--fx-dust2, #8fd0ff\) 45%/)
  })
  it('cada tema escuro define o fundo, os cartões e as cores do efeito', () => {
    for (const t of ['preto', 'vermelho', 'moderno']) {
      const block = new RegExp(String.raw`html\[data-theme="${t}"\] \{[^}]*--t-bg: #[0-9a-f]{6};[^}]*--t-card:`)
      expect(themes, t).toMatch(block)
    }
    for (const t of ['preto', 'vermelho']) expect(themes, t).toMatch(new RegExp(String.raw`html\[data-theme="${t}"\] \{[^}]*--fx-wave:`))
  })
  it('nos temas escuros, a foto azul do fundo sai', () => {
    expect(themes).toMatch(/html\[data-theme\]:not\(\[data-theme="azul"\]\) \.bgfx-image \{ display: none; \}/)
  })
  it('o moderno é liso: sem brilho, ondas e partículas', () => {
    expect(themes).toMatch(/html\[data-theme="moderno"\] :is\(\.bgfx-glow, \.bgfx-wave-a, \.bgfx-wave-b, \.bgfx-particle\) \{ display: none; \}/)
  })
})
