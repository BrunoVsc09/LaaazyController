// Equalizador: estado da tela → texto do Equalizer APO. Sem I/O.
const { BANDS, BAND_LIMIT, EFFECT_MAX, PRESETS, CUSTOM } = require('../../shared/equalizer')

const PRESET_IDS = new Set([...PRESETS.map((p) => p.id), CUSTOM.id])

const APP_FILE = 'laaazy.txt'
const INCLUDE_LINE = `Include: ${APP_FILE}`
const HEADER = '# Gerado pelo Laaazy (Configurações → Som). Não edite: o Laaazy reescreve este arquivo.'

const Q = 1.41
const BASS = { fc: 100, dbPerStep: 1 } // Bass Boost 10 = +10 dB abaixo de 100 Hz
const CLARITY = { fc: 4000, dbPerStep: 0.6 } // Clarity 10 = +6 dB acima de 4 kHz
const LOW_LIMIT = 300 // bandas abaixo disso somam com o Bass Boost no preamp
const HIGH_LIMIT = 2700 // bandas a partir disso somam com o Clarity

// Estado inicial: ligado, tudo no zero (som igual ao original)
const FLAT = Object.freeze({ on: true, preset: 'geral', bands: Object.freeze(BANDS.map(() => 0)), bass: 0, clarity: 0 })

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max

function validState(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return false
  return typeof s.on === 'boolean' &&
    PRESET_IDS.has(s.preset) &&
    Array.isArray(s.bands) && s.bands.length === BANDS.length &&
    s.bands.every((db) => isInt(db, -BAND_LIMIT, BAND_LIMIT)) &&
    isInt(s.bass, 0, EFFECT_MAX) && isInt(s.clarity, 0, EFFECT_MAX)
}

const bassDb = (s) => s.bass * BASS.dbPerStep
const clarityDb = (s) => s.clarity * CLARITY.dbPerStep

// Reforço máximo de cada região; o preamp desconta o pior para o som não estourar
function preampDb(s) {
  const boost = (keep) => Math.max(0, ...s.bands.filter((_, i) => keep(BANDS[i])))
  const low = boost((fc) => fc < LOW_LIMIT) + bassDb(s)
  const high = boost((fc) => fc >= HIGH_LIMIT) + clarityDb(s)
  const mid = boost((fc) => fc >= LOW_LIMIT && fc < HIGH_LIMIT)
  return 0 - Math.max(low, high, mid)
}

const gain = (db) => `Gain ${db.toFixed(1)} dB`

function filters(s) {
  const out = []
  s.bands.forEach((db, i) => { if (db) out.push(`PK Fc ${BANDS[i]} Hz ${gain(db)} Q ${Q}`) })
  if (s.bass) out.push(`LSC Fc ${BASS.fc} Hz ${gain(bassDb(s))}`)
  if (s.clarity) out.push(`HSC Fc ${CLARITY.fc} Hz ${gain(clarityDb(s))}`)
  return out
}

function render(s) {
  if (!s.on) return `${HEADER}\nPreamp: 0.0 dB\n`
  const lines = [HEADER, `Preamp: ${preampDb(s).toFixed(1)} dB`]
  filters(s).forEach((f, i) => lines.push(`Filter ${i + 1}: ON ${f}`))
  return lines.join('\n') + '\n'
}

// config.txt que o instalador do APO cria (Preamp -6 dB + example.txt com reforço de grave)
const APO_DEFAULT = [
  'Preamp: -6 dB',
  'Include: example.txt',
  'GraphicEQ: 25 0; 40 0; 63 0; 100 0; 160 0; 250 0; 400 0; 630 0; 1000 0; 1600 0; 2500 0; 4000 0; 6300 0; 10000 0; 16000 0',
]
const isApoDefault = (lines) => {
  const own = lines.map((l) => l.trim()).filter((l) => l && l !== INCLUDE_LINE)
  return own.length === APO_DEFAULT.length && own.every((l, i) => l === APO_DEFAULT[i])
}

// config.txt do usuário com a linha Include (uma vez só), no mesmo final de linha do arquivo.
// O padrão do instalador não é escolha do usuário: ali fica só o Laaazy (senão o "Geral" não é neutro)
function withInclude(text) {
  const lines = text.split(/\r?\n/)
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  if (isApoDefault(lines)) return INCLUDE_LINE + eol
  if (lines.includes(INCLUDE_LINE)) return text
  const body = text && !text.endsWith('\n') ? text + eol : text
  return body + INCLUDE_LINE + eol
}

module.exports = { APP_FILE, INCLUDE_LINE, FLAT, validState, preampDb, render, withInclude }
