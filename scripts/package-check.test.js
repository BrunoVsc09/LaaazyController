import { describe, it, expect } from 'vitest'
import check from './package-check.js'

const GOOD = [
  '/package.json',
  '/electron/main.js', '/electron/preload.js', '/electron/stream-preload.js',
  '/electron/core/security.js', '/electron/assets/icon.ico', '/shared/channels.js',
  '/out/index.html', '/out/keyboard.html', '/out/_next/static/chunks/a.js',
]

describe('problemsIn: conferência do app.asar do .exe portátil', () => {
  it('pacote completo e limpo: nenhum problema', () => {
    expect(check.problemsIn(GOOD)).toEqual([])
  })
  it('aponta o que falta (tela, teclado por cima, preloads gerados)', () => {
    const list = GOOD.filter((f) => !['/out/keyboard.html', '/electron/preload.js'].includes(f))
    expect(check.problemsIn(list)).toEqual(['falta electron/preload.js', 'falta out/keyboard.html'])
  })
  it('aponta o que não deveria ir junto (testes, fontes dos preloads, segredos)', () => {
    const list = [...GOOD, '/electron/core/x.test.js', '/electron/preload.src.js', '/out/secrets.json', '/.env']
    expect(check.problemsIn(list)).toEqual([
      'sobra electron/core/x.test.js', 'sobra electron/preload.src.js', 'sobra out/secrets.json', 'sobra .env',
    ])
  })
  // Atualização assinada (2026-10-09): a chave privada do Bruno nunca pode ir no .exe
  it('nenhum arquivo .pem (chave) vai no pacote', () => {
    expect(check.problemsIn([...GOOD, '/release-key.pem'])).toEqual(['sobra release-key.pem'])
  })
  it('node_modules não vai no pacote: o Electron só usa módulos do Node e a tela já vem pronta em out/', () => {
    expect(check.problemsIn([...GOOD, '/node_modules/next/dist/server/next.js'])).toEqual(['sobra node_modules/next/dist/server/next.js'])
  })
  it('aponta o ícone da janela faltando (sem ele a barra de tarefas mostra o ícone do Electron)', () => {
    expect(check.problemsIn(GOOD.filter((f) => f !== '/electron/assets/icon.ico'))).toEqual(['falta electron/assets/icon.ico'])
  })
  it('aceita caminhos com barra invertida (listagem no Windows)', () => {
    expect(check.problemsIn(GOOD.map((f) => f.replace(/\//g, '\\')))).toEqual([])
  })
})
