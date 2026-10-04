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
}

const DEFAULTS = { closeDs4OnMenu: true, librarySort: 'asc', streamModes: {} }

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
