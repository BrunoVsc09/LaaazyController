import { describe, it, expect } from 'vitest'
import steam from './steam.js'
import epic from './epic.js'
import folder from './folder.js'
import merge from './merge.js'

describe('steam', () => {
  it('parseLibraryFolders lê os caminhos e desfaz o escape das barras', () => {
    const vdf = '"libraryfolders"\n{\n\t"0"\n\t{\n\t\t"path"\t\t"C:\\\\Program Files (x86)\\\\Steam"\n\t}\n\t"1"\n\t{\n\t\t"path"\t\t"D:\\\\SteamLibrary"\n\t}\n}'
    expect(steam.parseLibraryFolders(vdf)).toEqual(['C:\\Program Files (x86)\\Steam', 'D:\\SteamLibrary'])
  })
  it('parseAppManifest monta o jogo com URL de abertura e capa', () => {
    const acf = '"AppState"\n{\n\t"appid"\t\t"620"\n\t"name"\t\t"Portal 2"\n}'
    expect(steam.parseAppManifest(acf)).toEqual({
      id: 'steam:620', name: 'Portal 2', platform: 'Steam',
      launch: { type: 'url', value: 'steam://rungameid/620' },
      cover: 'https://cdn.akamai.steamstatic.com/steam/apps/620/header.jpg',
    })
  })
  it('ignora ferramentas (Redistributable, Proton, Steamworks...) e manifestos incompletos', () => {
    expect(steam.parseAppManifest('"appid" "228980" "name" "Steamworks Common Redistributables"')).toBeNull()
    expect(steam.parseAppManifest('"appid" "1" "name" "Proton 8.0"')).toBeNull()
    expect(steam.parseAppManifest('"name" "Sem id"')).toBeNull()
  })
  it('jogo baixando ou com instalação incompleta (StateFlags sem o bit 4) não aparece: a Steam não abre', () => {
    const acf = (flags) => `"appid" "620" "name" "Portal 2" "StateFlags" "${flags}"`
    expect(steam.parseAppManifest(acf(4))).not.toBeNull() // instalado
    expect(steam.parseAppManifest(acf(6))).not.toBeNull() // instalado, pede atualização (a Steam atualiza ao abrir)
    expect(steam.parseAppManifest(acf(1026))).toBeNull() // baixando
    expect(steam.parseAppManifest(acf(2))).toBeNull()
  })
  it('isManifestFile', () => {
    expect(steam.isManifestFile('appmanifest_620.acf')).toBe(true)
    expect(steam.isManifestFile('appmanifest_620.acf.tmp')).toBe(false)
  })
})

describe('epic', () => {
  const base = { DisplayName: 'Fortnite', AppName: 'Fortnite', CatalogNamespace: 'fn', CatalogItemId: 'abc', AppCategories: ['public', 'games'] }
  it('monta o jogo com URL do launcher codificada', () => {
    expect(epic.parseEpicManifest(base)).toEqual({
      id: 'epic:Fortnite', name: 'Fortnite', platform: 'Epic Games',
      launch: { type: 'url', value: 'com.epicgames.launcher://apps/fn%3Aabc%3AFortnite?action=launch&silent=true' },
    })
  })
  it('ignora o que não é jogo e manifestos incompletos', () => {
    expect(epic.parseEpicManifest({ ...base, AppCategories: ['plugins'] })).toBeNull()
    expect(epic.parseEpicManifest({ ...base, DisplayName: '' })).toBeNull()
    expect(epic.parseEpicManifest(null)).toBeNull()
  })
  it('sem AppCategories conta como jogo', () => {
    const { AppCategories, ...rest } = base
    expect(epic.parseEpicManifest(rest)).not.toBeNull()
  })
})

describe('folder', () => {
  it('isGameExe recusa instaladores, desinstaladores e afins', () => {
    expect(folder.isGameExe('Game.exe')).toBe(true)
    for (const n of ['unins000.exe', 'setup.exe', 'UnityCrashHandler64.exe', 'dxsetup.exe', 'EasyAntiCheat_Setup.exe', 'readme.txt']) {
      expect(folder.isGameExe(n)).toBe(false)
    }
  })
  it('isSkippedDir pula redistribuíveis e pastas ocultas', () => {
    expect(folder.isSkippedDir('_Redist')).toBe(true)
    expect(folder.isSkippedDir('.git')).toBe(true)
    expect(folder.isSkippedDir('Binaries')).toBe(false)
  })
  it('customGame cria id estável a partir do caminho', () => {
    expect(folder.customGame('C:\\Jogos\\Hades\\Hades.exe')).toEqual({ id: 'pc:c:\\jogos\\hades\\hades.exe', name: 'Hades', exe: 'C:\\Jogos\\Hades\\Hades.exe' })
    expect(folder.customGame('C:\\J\\Hades.lnk', 'Hades II').name).toBe('Hades II')
  })
})

describe('mergeGames', () => {
  it('junta, tira duplicados (fica o primeiro) e ordena por nome', () => {
    const a = [{ id: 'x', name: 'Zelda' }, { id: 'y', name: 'ábaco' }]
    const b = [{ id: 'x', name: 'Zelda (cópia)' }, { id: 'z', name: 'Celeste' }]
    expect(merge.mergeGames(a, b).map((g) => g.name)).toEqual(['ábaco', 'Celeste', 'Zelda'])
  })
})
