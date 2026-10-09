// settings.json com chaves conhecidas, padrões e validação.
const { validModes } = require('../core/routing')
const streaming = require('../../shared/streaming')
const THEMES = require('../../shared/themes')

const isText = (v) => typeof v === 'string'
const isBool = (v) => typeof v === 'boolean'

const RULES = {
  edgePath: isText,
  chromePath: isText,
  firefoxPath: isText,
  hydraPath: isText,
  laaazyPadPath: isText,
  psClosesApp: isBool,
  trailerPreview: isBool,
  trailerSound: isBool,
  lockCursor: isBool,
  edgeNoGpu: (v) => Array.isArray(v) && v.every((x) => streaming.some((s) => s.label === x)),
  librarySort: (v) => v === 'asc' || v === 'desc',
  theme: (v) => THEMES.some((t) => t.id === v),
  streamModes: (v) => validModes(v, streaming),
  screensaverMinutes: (v) => [0, 5, 10, 15, 30].includes(v),
  geminiModel: (v) => isText(v) && /^[a-z0-9][a-z0-9.-]{0,60}$/.test(v),
  pinnedApps: (v) => Array.isArray(v) && v.length <= 30 && v.every((x) => isText(x) && x.length > 0 && x.length <= 40),
}

const DEFAULTS = { theme: 'azul', psClosesApp: true, trailerPreview: true, trailerSound: false, lockCursor: true, edgeNoGpu: ['Crunchyroll'], librarySort: 'asc', streamModes: {}, screensaverMinutes: 10, geminiModel: 'gemini-3.8-flash' }

function createSettings({ read, write }) {
  const all = () => ({ ...DEFAULTS, ...read() })
  const get = (key) => all()[key]
  function set(key, value) {
    const rule = RULES[key]
    if (!rule || !rule(value)) return false
    return write({ ...read(), [key]: value })
  }
  return { all, get, set }
}

module.exports = { createSettings, DEFAULTS }
