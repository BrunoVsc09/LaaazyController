import { describe, it, expect } from 'vitest'
import { WELCOME_STEPS, stepAfter, stepBefore, CREATOR, HARDWARE, APIS, nameError, nameSaveError } from './onboarding'

// Boas-vindas (pedido do Bruno, 2026-10-09)
describe('passos das boas-vindas', () => {
  it('ordem: boas-vindas, perfil, cor, controle, APIs, pronto', () => {
    expect(WELCOME_STEPS.map((s) => s.id)).toEqual(['intro', 'perfil', 'cor', 'controle', 'apis', 'pronto'])
  })
  it('✕/Continuar vai para o próximo e ○/Voltar para o anterior, sem passar das pontas', () => {
    expect(stepAfter('intro')).toBe('perfil')
    expect(stepAfter('pronto')).toBe('pronto')
    expect(stepBefore('perfil')).toBe('intro')
    expect(stepBefore('intro')).toBe('intro')
  })
  it('nome do perfil: explica o que falta (a regra de verdade é a do Electron)', () => {
    expect(nameError('Bruno')).toBe('')
    expect(nameError('  ')).toBe('Escolha um nome.')
    expect(nameError('x'.repeat(21))).toBe('Use até 20 letras.')
  })
})

describe('introdução', () => {
  it('quem fez, com o GitHub do Bruno', () => {
    expect(CREATOR.github).toBe('https://github.com/BrunoVsc09')
    expect(CREATOR.handle).toBe('BrunoVsc09')
    expect(CREATOR.name).toBe('Bruno')
  })
  it('recomendações de hardware: sistema, desempenho, tela, controle e internet', () => {
    expect(HARDWARE.map((h) => h.id)).toEqual(['sistema', 'desempenho', 'tela', 'controle', 'internet'])
    expect(HARDWARE.every((h) => h.title && h.text)).toBe(true)
  })
})

describe('APIs explicadas', () => {
  it('TMDB recomendada; Gemini, YouTube e SteamGridDB opcionais, cada uma com onde pegar a chave', () => {
    expect(APIS.map((a) => [a.id, a.required])).toEqual([['tmdb', true], ['gemini', false], ['youtube', false], ['steamgrid', false]])
    expect(APIS.every((a) => a.what && a.where)).toBe(true)
  })
})

// Trocar nome e foto nas Configurações (pedido do Bruno, 2026-10-09)
describe('nameSaveError', () => {
  it('nome novo e válido: pode salvar', () => {
    expect(nameSaveError('Bruno', 'Bruninho')).toBe('')
  })
  it('igual ao atual (com espaços a mais), vazio ou grande demais: diz o porquê', () => {
    expect(nameSaveError('Bruno', ' Bruno ')).toBe('Esse já é o seu nome.')
    expect(nameSaveError('Bruno', '  ')).toBe('Escolha um nome.')
    expect(nameSaveError('Bruno', 'x'.repeat(21))).toBe('Use até 20 letras.')
  })
})
