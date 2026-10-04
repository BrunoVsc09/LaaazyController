// settings.json com chaves conhecidas, padrões e validação.
const { validModes } = require('../core/routing')
const streaming = require('../../shared/streaming')

const isText = (v) => typeof v === 'string'
const isBool = (v) => typeof v === 'boolean'

const RULES = {
  edgePath: isText,
  chromePath: isText,
  firefoxPath: isText,
  hydraPath: isText,
  ds4Path: isText,
  closeDs4OnMenu: isBool,
  librarySort: (v) => v === 'asc' || v === 'desc',
  streamModes: (v) => validModes(v, streaming),
  screensaverMinutes: (v) => [0, 5, 10, 15, 30].includes(v),
  pinnedApps: (v) => Array.isArray(v) && v.length <= 30 && v.every((x) => isText(x) && x.length > 0 && x.length <= 40),
}

const DEFAULTS = { closeDs4OnMenu: true, librarySort: 'asc', streamModes: {}, screensaverMinutes: 10 }

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
