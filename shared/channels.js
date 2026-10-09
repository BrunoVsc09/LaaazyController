// Nomes de todos os canais IPC (processo principal ↔ telas). Um lugar só.
module.exports = {
  OPEN: 'open',
  HOME: 'home',
  BACK: 'back',
  KEY: 'key',
  QUIT: 'quit',
  GO_HOME: 'go-home', // principal → tela
  PS_TESTED: 'ps:tested', // principal → tela
  PS_TEST_START: 'ps:testStart',
  OSK_OPENED: 'osk:opened', // principal → teclado por cima
  OSK_EDIT: 'osk:edit', // tempo real: { move, back, text, enter } no campo do site
  OSK_CLOSE: 'osk:close',
  LAUNCH: 'launch',
  EXE_GET: 'exe:get',
  EXE_CHOOSE: 'exe:choose',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  DS4_GET: 'ds4:get',
  DS4_SET: 'ds4:set',
  DS4_PROFILE: 'ds4:profile', // editor de perfis: um perfil do Laaazy-pad, botão a botão
  DS4_SET_BUTTON: 'ds4:setButton', // editor de perfis: muda um botão (tecla, clique ou nada)
  STORE_WARNINGS: 'store:warnings',
  GAMES_LIST: 'games:list',
  GAMES_LAUNCH: 'games:launch',
  GAMES_ADD_EXE: 'games:addExe',
  GAMES_ADD_FOLDER: 'games:addFolder',
  GAMES_REMOVE: 'games:remove',
  GAMES_ADD_EXE_PATH: 'games:addExePath',
  GAMES_ADD_FOLDER_PATH: 'games:addFolderPath',
  FS_LIST: 'fs:list',
  USER_GET: 'user:get', // perfil de quem usa o Laaazy (nome, foto, boas-vindas)
  USER_SET: 'user:set',
  USER_SET_PHOTO: 'user:setPhoto', // foto do PC escolhida com o controle (caminho)
  USER_CHOOSE_PHOTO: 'user:choosePhoto', // foto do PC pela janela do Windows
  USER_FINISH: 'user:finish', // terminou as boas-vindas
  DRM_STATUS: 'drm:status',
  CATALOG_STATUS: 'catalog:status',
  CATALOG_SET_KEY: 'catalog:setKey',
  CATALOG_CLEAR_KEY: 'catalog:clearKey',
  CATALOG_HOME: 'catalog:home',
  CATALOG_TRAILER: 'catalog:trailer',
  CATALOG_SEARCH: 'catalog:search',
  CATALOG_WHERE: 'catalog:where',
  CATALOG_EPISODES: 'catalog:episodes',
  CATALOG_EXPLORE: 'catalog:explore',
  GAMES_RECENT: 'games:recent',
  MYLIST_GET: 'mylist:get',
  MYLIST_TOGGLE: 'mylist:toggle',
  POWER_RUN: 'power:run',
  POWER_LOGIN_GET: 'power:loginGet',
  POWER_LOGIN_SET: 'power:loginSet',
  VOLUME: 'volume',
  CLIPBOARD_READ: 'clipboard:read',
  AI_STATUS: 'ai:status',
  AI_SET_KEY: 'ai:setKey',
  AI_CLEAR_KEY: 'ai:clearKey',
  AI_SIMILAR: 'ai:similar',
  DESKTOP_ENTER: 'desktop:enter',
  YT_STATUS: 'yt:status',
  YT_SET_KEY: 'yt:setKey',
  YT_CLEAR_KEY: 'yt:clearKey',
  COVERS_STATUS: 'covers:status',
  COVERS_SET_KEY: 'covers:setKey',
  COVERS_CLEAR_KEY: 'covers:clearKey',
}
