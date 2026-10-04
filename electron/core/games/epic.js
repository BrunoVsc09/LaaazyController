// Leitura dos manifestos (.item) da Epic Games. Sem I/O.
function parseEpicManifest(j) {
  if (!j || !j.DisplayName || !j.AppName) return null
  if (Array.isArray(j.AppCategories) && !j.AppCategories.includes('games')) return null
  const key = encodeURIComponent(`${j.CatalogNamespace}:${j.CatalogItemId}:${j.AppName}`)
  return {
    id: 'epic:' + j.AppName, name: j.DisplayName, platform: 'Epic Games',
    launch: { type: 'url', value: `com.epicgames.launcher://apps/${key}?action=launch&silent=true` },
  }
}

module.exports = { parseEpicManifest }
