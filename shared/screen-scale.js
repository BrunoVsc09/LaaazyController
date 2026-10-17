// Tamanho do Laaazy (processo principal valida, tela mostra). Um lugar só.
// % do tamanho de hoje: a tela inteira cresce junto, para ler de longe (pedido do Bruno, 2026-10-16).
module.exports = {
  SCREEN_SCALES: [
    { value: 100, label: 'Normal' },
    { value: 125, label: 'Grande' },
    { value: 150, label: 'Maior' },
    { value: 175, label: 'Cama' },
  ],
  DEFAULT_SCREEN_SCALE: 100,
}
