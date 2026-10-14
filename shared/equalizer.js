// Equalizador (Configurações → Som). Usado pelo Electron (validar e gerar o arquivo) e pela tela.
// Frequências das 10 bandas, em Hz
const BANDS = [62, 115, 250, 450, 630, 1250, 2700, 5300, 7500, 13000]
const BAND_LIMIT = 12 // cada banda vai de -12 a +12 dB
const EFFECT_MAX = 10 // Bass Boost e Clarity vão de 0 a 10

// Presets do Laaazy (valores nossos). bands na ordem de BANDS
const PRESETS = [
  { id: 'geral', label: 'Geral', bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: 0, clarity: 0 },
  { id: 'musica', label: 'Música', bands: [3, 2, 0, -1, 0, 0, 1, 2, 2, 1], bass: 3, clarity: 2 },
  { id: 'filmes', label: 'Filmes', bands: [2, 2, 0, 0, 1, 2, 2, 1, 0, 0], bass: 4, clarity: 1 },
  { id: 'jogos', label: 'Jogos', bands: [2, 1, -1, 0, 0, 1, 3, 3, 2, 1], bass: 2, clarity: 3 },
  { id: 'voz', label: 'Voz', bands: [-3, -2, -1, 1, 2, 3, 3, 1, 0, -1], bass: 0, clarity: 4 },
]
// Nome do estado quando o usuário mexe numa banda depois de escolher um preset
const CUSTOM = { id: 'personalizado', label: 'Personalizado' }

module.exports = { BANDS, BAND_LIMIT, EFFECT_MAX, PRESETS, CUSTOM }
