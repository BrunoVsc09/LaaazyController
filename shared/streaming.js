// Serviços de streaming. mode: 'app' (dentro do app) ou 'edge' (Edge em tela cheia).
// Usado pelo Electron (para decidir onde abrir) e pela tela (cards e Configurações).
module.exports = [
  { label: 'Crunchyroll', url: 'https://www.crunchyroll.com', domain: 'crunchyroll.com', mode: 'edge' },
  { label: 'HBO Max', url: 'https://www.hbomax.com', domain: 'hbomax.com', mode: 'app' },
  { label: 'Prime Video', url: 'https://www.primevideo.com', domain: 'primevideo.com', mode: 'app' },
  { label: 'Netflix', url: 'https://www.netflix.com', domain: 'netflix.com', mode: 'app' },
  { label: 'YouTube', url: 'https://www.youtube.com/tv', domain: 'youtube.com', mode: 'app' },
  { label: 'Spotify', url: 'https://open.spotify.com', domain: 'spotify.com', mode: 'app' },
]
