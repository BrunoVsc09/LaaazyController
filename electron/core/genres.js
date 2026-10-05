// Gêneros do Explorar (Busca) → ids do TMDB. Sem I/O.
// Gênero do app → ids do TMDB (filmes e séries têm listas diferentes; null = não existe)
const GENRES = {
  acao: { movie: 28, tv: 10759 },
  aventura: { movie: 12, tv: 10759 },
  animacao: { movie: 16, tv: 16 },
  comedia: { movie: 35, tv: 35 },
  crime: { movie: 80, tv: 80 },
  documentario: { movie: 99, tv: 99 },
  drama: { movie: 18, tv: 18 },
  familia: { movie: 10751, tv: 10751 },
  fantasia: { movie: 14, tv: 10765 },
  ficcao_cientifica: { movie: 878, tv: 10765 },
  guerra: { movie: 10752, tv: 10768 },
  misterio: { movie: 9648, tv: 9648 },
  romance: { movie: 10749, tv: null },
  suspense: { movie: 53, tv: null },
  terror: { movie: 27, tv: null },
  faroeste: { movie: 37, tv: 37 },
  infantil: { movie: 10751, tv: 10762 },
  reality: { movie: null, tv: 10764 },
}

module.exports = { GENRES }
