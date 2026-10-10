// Boas-vindas (primeira vez que o Laaazy abre): passos, textos e regras. Sem DOM.

export const WELCOME_STEPS = [
  { id: 'intro', title: 'Boas-vindas' },
  { id: 'perfil', title: 'Seu perfil' },
  { id: 'cor', title: 'Cor do Laaazy' },
  { id: 'controle', title: 'Controle' },
  { id: 'apis', title: 'Filmes, IA e capas' },
  { id: 'pronto', title: 'Pronto' },
] as const
export type WelcomeStep = (typeof WELCOME_STEPS)[number]['id']

const ids = WELCOME_STEPS.map((s) => s.id) as WelcomeStep[]
export const stepAfter = (s: WelcomeStep): WelcomeStep => ids[Math.min(ids.indexOf(s) + 1, ids.length - 1)]
export const stepBefore = (s: WelcomeStep): WelcomeStep => ids[Math.max(ids.indexOf(s) - 1, 0)]

// O que dizer antes de mandar o nome (o Electron confere de novo)
export function nameError(name: string): string {
  const n = name.trim()
  if (!n) return 'Escolha um nome.'
  return n.length > 20 ? 'Use até 20 letras.' : ''
}

// Configurações → Seu perfil: "Salvar nome" ('' = pode salvar)
export const nameSaveError = (current: string, typed: string) =>
  typed.trim() === current ? 'Esse já é o seu nome.' : nameError(typed)

export const CREATOR = {
  name: 'Bruno',
  handle: 'BrunoVsc09',
  github: 'https://github.com/BrunoVsc09',
  role: 'Desenvolvedor full stack',
  text: 'O Laaazy é feito em pair programming com IA, com testes do começo ao fim. Cada recurso nasceu de um pedido de quem usa o app no sofá.',
}

export const HARDWARE = [
  { id: 'sistema', title: 'Windows 10 ou 11', text: '64 bits, com o Microsoft Edge (já vem no Windows)' },
  { id: 'desempenho', title: '4 núcleos e 8 GB de RAM', text: 'para o menu e os streamings; jogos pedem o que cada jogo pede' },
  { id: 'tela', title: 'TV ou monitor Full HD', text: 'o Laaazy foi desenhado para ler do sofá' },
  { id: 'controle', title: 'Um controle', text: 'DualShock 4, 8BitDo, Xbox e outros, por cabo ou Bluetooth' },
  { id: 'internet', title: 'Internet de 25 Mb/s', text: 'para filmes e séries em Full HD' },
]

export const APIS = [
  { id: 'tmdb', title: 'Filmes e séries (TMDB)', required: true, what: 'Mostra no Início os filmes, séries e animes dos seus streamings, com capa, resumo e prévia.', where: 'Grátis em themoviedb.org → Configurações → API.' },
  { id: 'gemini', title: 'Parecidos (Gemini)', required: false, what: 'Com △ num título, a IA acha outros com o mesmo clima.', where: 'Grátis em aistudio.google.com → Get API key.' },
  { id: 'youtube', title: 'Trailers dublados (YouTube)', required: false, what: 'Procura trailers dublados ou legendados em português para a prévia.', where: 'Grátis no Google Cloud → YouTube Data API v3 → Credenciais.' },
  { id: 'steamgrid', title: 'Capas dos jogos (SteamGridDB)', required: false, what: 'Capas bonitas para os jogos da Biblioteca que não têm.', where: 'Grátis em steamgriddb.com → Preferências → API.' },
] as const
