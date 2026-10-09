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
