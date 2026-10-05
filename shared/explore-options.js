// Opções de "Explorar sem digitar" (Busca). Usado pela tela (botões) e pelo Electron (validação).
module.exports = {
  KINDS: [
    { id: 'any', label: 'Tudo' },
    { id: 'movie', label: 'Filmes' },
    { id: 'tv', label: 'Séries' },
  ],
  GENRES: [
    { id: 'acao', label: 'Ação' },
    { id: 'aventura', label: 'Aventura' },
    { id: 'animacao', label: 'Animação' },
    { id: 'comedia', label: 'Comédia' },
    { id: 'crime', label: 'Crime' },
    { id: 'documentario', label: 'Documentário' },
    { id: 'drama', label: 'Drama' },
    { id: 'familia', label: 'Família' },
    { id: 'fantasia', label: 'Fantasia' },
    { id: 'ficcao_cientifica', label: 'Ficção científica' },
    { id: 'guerra', label: 'Guerra' },
    { id: 'misterio', label: 'Mistério' },
    { id: 'romance', label: 'Romance' },
    { id: 'suspense', label: 'Suspense' },
    { id: 'terror', label: 'Terror' },
    { id: 'faroeste', label: 'Faroeste' },
    { id: 'infantil', label: 'Infantil' },
    { id: 'reality', label: 'Reality' },
  ],
  DURATIONS: [
    { id: 'any', label: 'Qualquer' },
    { id: 'short', label: 'Até 1h30' },
    { id: 'medium', label: '1h30 a 2h' },
    { id: 'long', label: 'Mais de 2h' },
  ],
  SORTS: [
    { id: 'popular', label: 'Populares' },
    { id: 'recent', label: 'Mais recentes' },
    { id: 'rated', label: 'Mais bem avaliados' },
  ],
}
