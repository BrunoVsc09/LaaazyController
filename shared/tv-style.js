// Tamanho da legenda nos serviços abertos no Edge (processo principal valida, tela mostra). Um lugar só.
// vh = porcentagem da altura da tela; 0 = não mexe (fica o tamanho do site).
module.exports = {
  SUBTITLE_SIZES: [
    { id: 'site', label: 'Do site', vh: 0 },
    { id: 'normal', label: 'Normal', vh: 5 },
    { id: 'grande', label: 'Grande', vh: 7 },
    { id: 'enorme', label: 'Enorme', vh: 9 },
  ],
  DEFAULT_SUBTITLE_SIZE: 'grande',
}
