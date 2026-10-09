import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// main.js é a raiz de composição (liga as peças do Electron) e não roda nos testes; aqui ficam
// travadas as ligações que já deram problema
const main = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8')

// Regressão (2026-10-08, achado pelo Bruno: "o Laaazy da Área de trabalho não abre"): a janela
// escondida do teclado por cima mantinha o programa vivo depois de fechar a janela principal, e
// clicar no atalho de novo caía nessa instância sem janela nenhuma
describe('fechar o Laaazy', () => {
  it('fechar a janela principal encerra o programa (mesmo com o teclado por cima criado)', () => {
    expect(main).toMatch(/onClosed: \(\) => \{ stream\.forget\(\); app\.quit\(\) \}/)
  })
})

// O DS4Windows saiu (2026-10-09). O Laaazy-pad não cria controle virtual, então não atrapalha a
// leitura do controle no menu: fica aberto o tempo todo e fecha junto com o Laaazy
describe('Laaazy-pad: abre junto, fica aberto e fecha junto', () => {
  it('abre ao iniciar e carrega o perfil do Menu', () => {
    expect(main).toMatch(/ds4\.ensureRunning\(\)[^\n]*\n\s*ds4\.applyFor\('menu'\)/)
  })
  it('ao sair, espera o Laaazy-pad fechar (no máximo alguns segundos) antes de terminar', () => {
    expect(main).toMatch(/app\.on\('will-quit', \(e\) => \{[\s\S]*?e\.preventDefault\(\)[\s\S]*?Promise\.race\(\[ds4\.shutdown\(\), sleep\(\d+\)\]\)/)
  })
  it('não existe mais "fechar o DS4Windows no menu": o PS não fecha o Laaazy-pad', () => {
    expect(main).not.toMatch(/closeDs4OnMenu/)
  })
})

// F19–F24 eram teclas que o DS4Windows mandava; o Laaazy-pad manda Ctrl+Alt (PS = Home,
// Share = K, L2/R2 = ↓/↑). Fica só a versão com Ctrl+Alt de cada atalho.
describe('atalhos globais sem as teclas F do DS4Windows', () => {
  it('PS, fechar o da frente e teclado por cima só com Ctrl+Alt', () => {
    for (const key of ['Home', 'End', 'K']) expect(main).toContain(`'CommandOrControl+Alt+${key}'`)
    expect(main).not.toMatch(/'F(19|2[0-4])'/)
  })
})

// Remover jogo da Steam/Epic oculta (pedido do Bruno, 2026-10-09): os ocultos ficam num arquivo próprio
describe('Biblioteca: jogos ocultos', () => {
  it('a Biblioteca lê e grava hidden-games.json', () => {
    expect(main).toMatch(/readHidden: \(\) => store\.readJson\(userFile\('hidden-games\.json'\), \[\]\)/)
    expect(main).toMatch(/writeHidden: \(ids\) => store\.writeJson\(userFile\('hidden-games\.json'\), ids\)/)
  })
})

// Atualização pelo GitHub (pedido do Bruno, 2026-10-09)
describe('atualização', () => {
  it('instalado pelo Setup instala sozinho; portátil só avisa; pnpm app nem pergunta', () => {
    expect(main).toMatch(/mode: \(\) => \(!app\.isPackaged \? 'dev' : process\.env\.PORTABLE_EXECUTABLE_DIR \? 'portable' : 'installer'\)/)
  })
  it('a rede passa pelo Electron (proxy do Windows) e o instalador roda solto, com os argumentos do NSIS', () => {
    expect(main).toMatch(/createGithubReleases\(\{ fetch: net\.fetch \}\)/)
    expect(main).toMatch(/runInstaller: \(file\) => spawnDetached\(file, INSTALLER_ARGS\)/)
    expect(main).toMatch(/ {2}updater,\r?\n {2}drmStatus/)
  })
})
