import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import mod from './laaazy-pad-bundle.js'

const GOOD = ['LaaazyPad.exe', 'LaaazyPadCmd.exe', 'SDL3.dll', 'SDL3-LICENSE.txt', 'PerfisPadrao/Jogos.json', 'PerfisPadrao/PC.json', 'LaaazyPad.dll']

// Laaazy-pad junto no instalador (pedido do Bruno, 2026-10-09)
describe('padProblems: o Laaazy-pad que vai no instalador', () => {
  it('completo: os dois exes, o SDL3 (com a licença) e os perfis padrão', () => {
    expect(mod.padProblems(GOOD)).toEqual([])
    expect(mod.padProblems(GOOD.filter((f) => f !== 'SDL3.dll' && f !== 'PerfisPadrao/PC.json'))).toEqual(['falta SDL3.dll', 'falta PerfisPadrao/PC.json'])
  })
  it('sem pasta Profiles: com ela o Laaazy-pad guardaria os perfis dentro da pasta do Laaazy e a atualização apagaria', () => {
    expect(mod.padProblems([...GOOD, 'Profiles/Jogos.json'])).toEqual(['sobra Profiles/Jogos.json'])
  })
  it('sem chave (.pem) nem arquivos de depuração', () => {
    expect(mod.padProblems([...GOOD, 'release-key.pem', 'LaaazyPad.pdb'])).toEqual(['sobra release-key.pem', 'sobra LaaazyPad.pdb'])
  })
  it('aceita barra invertida do Windows nos caminhos', () => {
    expect(mod.padProblems(GOOD.map((f) => f.replace('/', '\\')))).toEqual([])
  })
})

describe('onde fica', () => {
  it('projeto do Laaazy-pad ao lado do Laaazy (ou LAAAZY_PAD_DIR); a cópia vai para build/laaazy-pad', () => {
    const root = path.join('C:', 'dev', 'lazy')
    expect(mod.paths(root, {})).toEqual({
      project: path.join('C:', 'dev', 'laaazy-pad'),
      published: path.join('C:', 'dev', 'laaazy-pad', 'publicado', 'Laaazy-pad'),
      bundle: path.join(root, 'build', 'laaazy-pad'),
    })
    expect(mod.paths(root, { LAAAZY_PAD_DIR: 'E:/pad' }).project).toBe('E:/pad')
  })
})

describe('pacote', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
  it('o instalador leva build/laaazy-pad para resources/laaazy-pad (fora do app.asar: .exe não roda de dentro dele)', () => {
    expect(pkg.build.extraResources).toEqual([{ from: 'build/laaazy-pad', to: 'laaazy-pad' }])
  })
  it('pnpm dist gera o Laaazy-pad antes de empacotar', () => {
    expect(pkg.scripts.dist).toMatch(/next build && node scripts\/laaazy-pad-bundle\.js && electron-builder/)
  })
  it('a cópia não vai para o git', () => {
    expect(fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8')).toMatch(/^\/?build\/laaazy-pad\/?\r?$/m)
  })
})
