// Serviços de streaming. Usado pelo Electron (onde abrir) e pela tela (cards e Configurações).
// mode: 'app' (dentro do app) ou 'edge' (Edge em tela cheia). drm: precisa do Widevine.
// Todos abrem no Edge por padrão: DRM dentro do app exige assinatura VMP de produção,
// que a castlabs só libera para contas corporativas (Netflix dava erro E100).
// Dá para trocar por serviço em Configurações.
module.exports = [
  { label: 'Crunchyroll', url: 'https://www.crunchyroll.com', domain: 'crunchyroll.com', mode: 'edge', drm: true },
  { label: 'HBO Max', url: 'https://www.hbomax.com', domain: 'hbomax.com', mode: 'edge', drm: true },
  { label: 'Prime Video', url: 'https://www.primevideo.com', domain: 'primevideo.com', mode: 'edge', drm: true },
  { label: 'Netflix', url: 'https://www.netflix.com', domain: 'netflix.com', mode: 'edge', drm: true },
  { label: 'YouTube', url: 'https://www.youtube.com/tv', domain: 'youtube.com', mode: 'edge', drm: false },
  { label: 'Spotify', url: 'https://open.spotify.com', domain: 'spotify.com', mode: 'edge', drm: true },
]
