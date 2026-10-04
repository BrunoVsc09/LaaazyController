// Leitura dos arquivos da Steam (libraryfolders.vdf e appmanifest_*.acf). Sem I/O.
const SKIP = /Redistributable|Steamworks|Runtime|Proton|Steam Controller|Steam Linux/i

const parseLibraryFolders = (vdf) =>
  [...vdf.matchAll(/"path"\s+"([^"]+)"/g)].map((m) => m[1].replace(/\\\\/g, '\\'))

const isManifestFile = (name) => /^appmanifest_\d+\.acf$/.test(name)

function parseAppManifest(acf) {
  const id = (acf.match(/"appid"\s+"(\d+)"/) || [])[1]
  const name = (acf.match(/"name"\s+"([^"]+)"/) || [])[1]
  if (!id || !name || SKIP.test(name)) return null
  return {
    id: 'steam:' + id, name, platform: 'Steam',
    launch: { type: 'url', value: 'steam://rungameid/' + id },
    cover: `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`,
  }
}

module.exports = { parseLibraryFolders, parseAppManifest, isManifestFile }
