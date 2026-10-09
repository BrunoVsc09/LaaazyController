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
