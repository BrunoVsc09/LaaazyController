import { describe, it, expect } from 'vitest'
import { updateCopy } from './update'

// Aviso de versão nova ao abrir o Laaazy (pedido do Bruno, 2026-10-09)
describe('updateCopy', () => {
  it('instalado pelo Setup: atualiza daqui mesmo', () => {
    expect(updateCopy({ version: '3.6.0', canInstall: true })).toEqual({
      title: 'Nova versão 3.6.0',
      body: 'O Laaazy baixa a atualização, confere e instala sozinho. Ele fecha e abre de novo já atualizado.',
      action: 'Atualizar agora',
    })
  })
  it('portátil: não se instala sozinho, abre a página da versão', () => {
    expect(updateCopy({ version: '3.6.0', canInstall: false })).toEqual({
      title: 'Nova versão 3.6.0',
      body: 'Esta é a versão portátil: baixe a nova na página do GitHub.',
      action: 'Abrir no GitHub',
    })
  })
})
