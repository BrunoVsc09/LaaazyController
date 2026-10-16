// Opções de "falta de uso" (processo principal valida, tela mostra). Um lugar só.
module.exports = {
  PAD_IDLE_MINUTES: [0, 5, 10, 15, 30], // controle parado desliga do Bluetooth (0 = nunca; padrão 10)
  IDLE_HOURS: [0, 2, 3, 4, 6], // PC sem uso desliga (0 = nunca, o padrão)
}
