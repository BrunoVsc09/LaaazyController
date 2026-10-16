// Serviços abertos no Edge com cara de TV: tamanho da legenda e dos sites (processo principal
// valida, tela mostra). Um lugar só.
module.exports = {
  // vh = porcentagem da altura da tela; 0 = não mexe (fica o tamanho do site)
  SUBTITLE_SIZES: [
    { id: 'site', label: 'Do site', vh: 0 },
    { id: 'normal', label: 'Normal', vh: 6 },
    { id: 'grande', label: 'Grande', vh: 8 },
    { id: 'enorme', label: 'Enorme', vh: 10 },
    { id: 'gigante', label: 'Gigante', vh: 12 },
  ],
  DEFAULT_SUBTITLE_SIZE: 'grande',
  // % do tamanho normal: o Edge abre como se a tela fosse maior (100 = não mexe, o padrão)
  SITE_SCALES: [100, 125, 150, 175, 200],
  DEFAULT_SITE_SCALE: 100,
}
