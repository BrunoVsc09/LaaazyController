import { describe, it, expect } from 'vitest'
import mod from './release-notes.js'

// Novidades da versão (pedido do Bruno, 2026-10-14): depois que o Laaazy se atualiza e abre de novo,
// mostra o que mudou. Os textos vêm do CHANGELOG (a mesma seção "## X.Y.Z — data" que o pnpm release usa)
const CHANGELOG = [
  '# Novidades do Laaazy',
  '',
  '## Próxima versão',
  '',
  '### Novo',
  '- **Coisa futura:** ainda não saiu.',
  '',
  '## 3.6.6 — 2026-10-14',
  '',
  '### Novo',
  '- **Equalizador do Windows (Configurações → Som, pedido do Bruno):** presets, 10 bandas e',
  '  Bass Boost. Continua na linha de baixo.',
  '- **Saída de som preferida (pedido do Bruno):** lista curta.',
  '',
  '### Corrigido',
  '- **"Vídeo indisponível" na prévia do Início (achado pelo Bruno):** agora volta para a capa.',
  '- Sai o botão "Abrir a pasta dos perfis".',
  '- Netflix e Spotify usam o perfil **PC** do `DS4Windows` por padrão, e o resto do texto é bem comprido e continua, continua e continua até passar do limite.',
  '',
  '## 3.6.5 — 2026-10-10',
  '',
  '### Mudou',
  '- **Configurações mais limpas:** categorias.',
].join('\r\n')

describe('novidades: ler a seção da versão no CHANGELOG', () => {
  it('versão, data e cada parte (Novo, Mudou, Corrigido) com o título de cada item', () => {
    expect(mod.notesFor(CHANGELOG, '3.6.6')).toEqual({
      version: '3.6.6',
      date: '2026-10-14',
      sections: [
        { title: 'Novo', items: ['Equalizador do Windows', 'Saída de som preferida'] },
        {
          title: 'Corrigido',
          items: [
            '"Vídeo indisponível" na prévia do Início',
            'Sai o botão "Abrir a pasta dos perfis"',
            'Netflix e Spotify usam o perfil PC do DS4Windows por padrão, e o resto do texto…',
          ],
        },
      ],
    })
  })
  it('não mistura com a versão de baixo nem com a "Próxima versão"', () => {
    expect(mod.notesFor(CHANGELOG, '3.6.5').sections).toEqual([{ title: 'Mudou', items: ['Configurações mais limpas'] }])
  })
  it('versão que não está no CHANGELOG: nada (a janela não aparece)', () => {
    expect(mod.notesFor(CHANGELOG, '9.9.9')).toBe(null)
    expect(mod.notesFor('', '3.6.6')).toBe(null)
  })
  it('"3.6.1" não pega a seção "3.6.10"', () => {
    const c = '## 3.6.10 — 2026-11-01\n\n### Novo\n- **Dez:** x.\n'
    expect(mod.notesFor(c, '3.6.1')).toBe(null)
  })
})

// "Changelog: Configurações: Som / Ajustes no player do YouTube / Correções de bugs / Novos avatares :D"
// (Bruno, 2026-10-14): a janela mostra um resumo; o CHANGELOG detalhado continua indo para o GitHub
describe('novidades: destaques', () => {
  const C = [
    '## 3.6.6 — 2026-10-14',
    '',
    '### Destaques',
    '- Configurações: Som',
    '- Ajustes no player do YouTube',
    '- Correções de bugs',
    '- Novos avatares :D',
    '',
    '### Novo',
    '- **Equalizador do Windows (pedido do Bruno):** detalhe que vai só para o GitHub.',
  ].join('\n')
  it('com "### Destaques": a janela mostra só eles, escritos como estão', () => {
    expect(mod.notesFor(C, '3.6.6').sections).toEqual([
      { title: 'Destaques', items: ['Configurações: Som', 'Ajustes no player do YouTube', 'Correções de bugs', 'Novos avatares :D'] },
    ])
  })
})

// Imagem grande da janela por versão (pedido do Bruno, 2026-10-16): public/novidades/<versão>.webp
describe('novidades: imagem da versão', () => {
  const files = ['3.6.6.webp', '3.6.7.webp', 'LEIA-ME.txt']
  it('a da própria versão', () => {
    expect(mod.artFor('3.6.7', files)).toBe('novidades/3.6.7.webp')
    expect(mod.artFor('3.6.6', files)).toBe('novidades/3.6.6.webp')
  })
  it('versão sem imagem: a da versão anterior mais recente', () => {
    expect(mod.artFor('3.6.8', files)).toBe('novidades/3.6.7.webp')
    expect(mod.artFor('3.7.0', files)).toBe('novidades/3.6.7.webp')
  })
  it('compara como número (3.6.10 vem depois de 3.6.9)', () => {
    expect(mod.artFor('3.6.10', ['3.6.9.webp', '3.6.10.png'])).toBe('novidades/3.6.10.png')
    expect(mod.artFor('3.6.11', ['3.6.9.webp', '3.6.10.jpg'])).toBe('novidades/3.6.10.jpg')
  })
  it('nenhuma imagem igual ou anterior: sem imagem', () => {
    expect(mod.artFor('3.6.5', files)).toBe('')
    expect(mod.artFor('3.6.7', [])).toBe('')
  })
})

describe('novidades: quando mostrar', () => {
  it('a versão mudou desde a última vez: mostra', () => {
    expect(mod.shouldShow({ lastSeen: '3.6.5', current: '3.6.6', newUser: false })).toBe(true)
  })
  it('mesma versão: não mostra de novo', () => {
    expect(mod.shouldShow({ lastSeen: '3.6.6', current: '3.6.6', newUser: false })).toBe(false)
  })
  it('quem já usava e nunca viu uma janela de novidades (atualizou da 3.6.5): mostra', () => {
    expect(mod.shouldShow({ lastSeen: null, current: '3.6.6', newUser: false })).toBe(true)
  })
  it('primeira instalação: não mostra (aparecem as boas-vindas)', () => {
    expect(mod.shouldShow({ lastSeen: null, current: '3.6.6', newUser: true })).toBe(false)
  })
})
