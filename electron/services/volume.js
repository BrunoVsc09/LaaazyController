// Sobe, desce ou silencia o volume do Windows.
const { psLine } = require('../core/volume')

function createVolume({ send }) {
  function step(action) {
    const line = psLine(action)
    if (!line) return false
    send(line)
    return true
  }
  return { step }
}

module.exports = { createVolume }
