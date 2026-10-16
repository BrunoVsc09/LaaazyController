// Configurações por categoria (menu à esquerda, uma categoria por vez; L1/R1 trocam)
export type SectionId = 'perfil' | 'aparencia' | 'controle' | 'streaming' | 'chaves' | 'sistema' | 'avancado'

export const SETTINGS_SECTIONS: { id: SectionId; label: string; hint: string }[] = [
  { id: 'perfil', label: 'Perfil', hint: 'Seu nome e sua foto no topo do Laaazy.' },
  { id: 'aparencia', label: 'Aparência', hint: 'Cor do Laaazy, prévia do trailer e proteção de tela.' },
  { id: 'controle', label: 'Controle e mouse', hint: 'O que o PS faz, o mouse preso na tela, quando o controle desliga e os perfis.' },
  { id: 'streaming', label: 'Streaming', hint: 'Onde cada serviço abre: dentro do app ou no Edge.' },
  { id: 'chaves', label: 'Contas e chaves', hint: 'Chaves grátis que ligam filmes, trailers, capas e a IA.' },
  { id: 'sistema', label: 'Sistema', hint: 'Abrir junto com o Windows, desligar o PC sem uso e as boas-vindas.' },
  { id: 'avancado', label: 'Avançado', hint: 'Pastas dos programas, aceleração de vídeo e modelo da IA.' },
]

export function nextSection(id: SectionId, step: 1 | -1): SectionId {
  const i = SETTINGS_SECTIONS.findIndex((s) => s.id === id)
  return SETTINGS_SECTIONS[(i + step + SETTINGS_SECTIONS.length) % SETTINGS_SECTIONS.length].id
}

// Caminho achado vira "✓ Encontrado"; o caminho completo só no Avançado
export const pathStatus = (path: string) => (path ? '✓ Encontrado' : 'Não encontrado: toque para escolher')
