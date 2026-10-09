import { describe, it, expect } from 'vitest'
import mod from './fs-browse.js'

const dirent = (name, dir = false) => ({ name, isDirectory: () => dir, isFile: () => !dir })

describe('shapeEntries', () => {
  const raw = [dirent('setup.exe'), dirent('Jogos', true), dirent('leia.txt'), dirent('Hades.lnk'), dirent('.oculta', true), dirent('Ação', true), dirent('Game.EXE'), dirent('$Recycle.Bin', true)]
  it('modo jogo: pastas primeiro, depois .exe e .lnk; sem ocultas e sem outros arquivos', () => {
    expect(mod.shapeEntries(raw, 'C:\\X', 'file')).toEqual([
      { name: 'Ação', path: 'C:\\X\\Ação', type: 'dir' },
      { name: 'Jogos', path: 'C:\\X\\Jogos', type: 'dir' },
      { name: 'Game.EXE', path: 'C:\\X\\Game.EXE', type: 'exe' },
      { name: 'Hades.lnk', path: 'C:\\X\\Hades.lnk', type: 'lnk' },
      { name: 'setup.exe', path: 'C:\\X\\setup.exe', type: 'exe' },
    ])
  })
  it('modo pasta: só pastas', () => {
    expect(mod.shapeEntries(raw, 'C:\\X', 'dir').map((e) => e.name)).toEqual(['Ação', 'Jogos'])
  })
  // Boas-vindas: escolher a foto do perfil no PC, com o controle
  it('modo imagem: pastas e fotos (PNG, JPG, WebP), nada de programas', () => {
    const pics = [...raw, dirent('eu.PNG'), dirent('gato.jpeg'), dirent('fundo.webp'), dirent('anim.gif')]
    expect(mod.shapeEntries(pics, 'C:\\X', 'image')).toEqual([
      { name: 'Ação', path: 'C:\\X\\Ação', type: 'dir' },
      { name: 'Jogos', path: 'C:\\X\\Jogos', type: 'dir' },
      { name: 'eu.PNG', path: 'C:\\X\\eu.PNG', type: 'image' },
      { name: 'fundo.webp', path: 'C:\\X\\fundo.webp', type: 'image' },
      { name: 'gato.jpeg', path: 'C:\\X\\gato.jpeg', type: 'image' },
    ])
  })
  it('limite de 500 itens', () => {
    const many = Array.from({ length: 700 }, (_, i) => dirent(`d${i}`, true))
    expect(mod.shapeEntries(many, 'C:\\X', 'dir')).toHaveLength(500)
  })
})

describe('caminhos', () => {
  it('parentOf: pasta de cima; na raiz do disco, a lista de discos (null)', () => {
    expect(mod.parentOf('C:\\Jogos\\Hades')).toBe('C:\\Jogos')
    expect(mod.parentOf('C:\\Jogos')).toBe('C:\\')
    expect(mod.parentOf('C:\\')).toBeNull()
  })
  it('isBrowsable: só caminho absoluto do Windows, sem ".."', () => {
    expect(mod.isBrowsable('C:\\Jogos')).toBe(true)
    expect(mod.isBrowsable('D:\\')).toBe(true)
    expect(mod.isBrowsable('Jogos')).toBe(false)
    expect(mod.isBrowsable('C:\\Jogos\\..\\Windows')).toBe(false)
    expect(mod.isBrowsable('\\\\servidor\\pasta')).toBe(false)
    expect(mod.isBrowsable(42)).toBe(false)
  })
  it('isGameFile: .exe ou .lnk', () => {
    expect(mod.isGameFile('C:\\J\\a.exe')).toBe(true)
    expect(mod.isGameFile('C:\\J\\a.LNK')).toBe(true)
    expect(mod.isGameFile('C:\\J\\a.bat')).toBe(false)
  })
  it('places: atalhos que existem, na ordem', () => {
    const env = { USERPROFILE: 'C:\\Users\\ana', ProgramFiles: 'C:\\Program Files', 'ProgramFiles(x86)': 'C:\\Program Files (x86)' }
    const exists = (p) => p !== 'C:\\Program Files (x86)'
    expect(mod.places(env, exists)).toEqual([
      { label: 'Downloads', path: 'C:\\Users\\ana\\Downloads' },
      { label: 'Área de trabalho', path: 'C:\\Users\\ana\\Desktop' },
      { label: 'Arquivos de Programas', path: 'C:\\Program Files' },
    ])
  })
  it('drives: letras que existem', () => {
    expect(mod.drives((p) => p === 'C:\\' || p === 'E:\\')).toEqual(['C:\\', 'E:\\'])
  })
})
