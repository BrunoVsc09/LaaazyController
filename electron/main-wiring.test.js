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
  it('só instala o que a chave do Bruno assinou (a pública vem dentro do Laaazy)', () => {
    expect(main).toMatch(/publicKey: \(\) => RELEASE_PUBLIC_KEY,/)
  })
})

// Laaazy-pad junto no instalador (pedido do Bruno, 2026-10-09)
describe('Laaazy-pad que vem junto', () => {
  it('o localizador procura em resources/laaazy-pad do Laaazy instalado (no pnpm app, não)', () => {
    expect(main).toMatch(/bundledDir: app\.isPackaged \? process\.resourcesPath : null/)
  })
  it('antes de rodar o instalador, o Laaazy-pad fecha (no máximo 4 s de espera)', () => {
    expect(main).toMatch(/beforeInstall: \(\) => Promise\.race\(\[ds4\.shutdown\(\), sleep\(4000\)\]\)/)
  })
})

// Bateria, controle parado e PC sem uso (pedido do Bruno, 2026-10-15)
describe('bateria do controle e desligamentos por falta de uso', () => {
  it('o mesmo Laaazy-pad para os perfis e para a bateria', () => {
    expect(main).toMatch(/const padCli = createLaaazyPadCli\(/)
    expect(main).toMatch(/createDs4\(\{\s*cli: padCli,/)
    expect(main).toMatch(/createPadStatus\(\{\s*cli: padCli,/)
  })
  it('a bateria vai para a tela; o tempo do controle vem das Configurações e muda na hora', () => {
    expect(main).toMatch(/send: \(status\) => windows\.send\(C\.PAD_BATTERY, status\)/)
    expect(main).toMatch(/minutes: \(\) => settings\.get\('padIdleMinutes'\)/)
    expect(main).toMatch(/if \(ok && key === 'padIdleMinutes'\) padStatus\.setMinutes\(value\)/)
  })
  it('sem uso = teclado/mouse do Windows e o controle do Laaazy-pad; desliga pelo Energia (sem forçar)', () => {
    expect(main).toMatch(/systemIdle: \(\) => powerMonitor\.getSystemIdleTime\(\)/)
    expect(main).toMatch(/padIdle: \(\) => padStatus\.idleNow\(\)/)
    expect(main).toMatch(/shutdown: \(\) => power\.run\('shutdown', true\)/)
    expect(main).toMatch(/hours: \(\) => settings\.get\('idleShutdownHours'\)/)
  })
  it('com a opção ligada, o Windows não suspende antes (só a suspensão; a tela ainda apaga)', () => {
    expect(main).toMatch(/powerSaveBlocker\.start\('prevent-app-suspension'\)/)
    expect(main).not.toMatch(/prevent-display-sleep/)
  })
  it('aviso na tela só com o Laaazy na frente e sem streaming por cima; senão notificação do Windows', () => {
    expect(main).toMatch(/const laaazyVisible = \(\) => !!windows\.get\(\)\?\.isFocused\(\) && !stream\.isOpen\(\)/)
    expect(main).toMatch(/new Notification\(\{ title: 'Laaazy', body/)
  })
})

// Imagem da janela de Novidades por versão (pedido do Bruno, 2026-10-16)
describe('novidades: imagem por versão', () => {
  it('lê a pasta out/novidades (vem de public/novidades)', () => {
    expect(main).toMatch(/artFiles: \(\) => fs\.promises\.readdir\(path\.join\(OUT, 'novidades'\)\)/)
  })
})

// Legenda grande no Edge (pedido do Bruno, 2026-10-16): extensão do Laaazy só de CSS
describe('legenda grande no Edge', () => {
  it('a extensão fica nos dados do Laaazy, no tamanho das Configurações, e o launcher abre o Edge com ela', () => {
    expect(main).toMatch(/createTvStyle\(\{ size: \(\) => settings\.get\('subtitleSize'\), youtubeTv: \(\) => settings\.get\('youtubeTv'\), dir: userFile\('edge-ext'\), writeFiles \}\)/)
    expect(main).toMatch(/tvExtension: \(\) => tvStyle\.prepare\(\),/)
    expect(main).toMatch(/siteScale: \(\) => settings\.get\('siteScale'\),/)
  })
})
