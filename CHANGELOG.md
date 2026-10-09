# Novidades do Laaazy

## Próxima versão (ainda não lançada)

### Novo
- **Editor de perfis do controle (pedido do Bruno):** a tela Perfis do controle virou um editor
  em preto, estilo Hydra. Em cada perfil (Jogos, PC) você vê o controle desenhado e o que cada
  botão faz, e muda um botão para uma tecla (atalhos comuns ou gravar no teclado), um clique
  (esquerdo, direito, meio, voltar, avançar) ou nada. Salvar aplica na hora se o perfil estiver
  ativo. Os comandos de que o Laaazy depende não mudam: PS (voltar ao Início) nos dois perfis e,
  no PC, Share (teclado por cima) e L2/R2 (volume). O original de cada perfil fica guardado em
  `<Nome>.json.bak` na primeira vez que ele é salvo. A escolha de perfil por app foi para a aba
  "Em cada app"; L1/R1 trocam a aba.

- **Boas-vindas (pedido do Bruno):** na primeira vez que o Laaazy abre, um passo a passo com o
  controle: introdução (o que é o Laaazy, quem fez, com o GitHub, e o hardware recomendado), seu
  perfil (nome e foto: uma das autorais ou uma do seu PC, escolhida com o controle), a cor do
  Laaazy, o controle (perfis Jogos e PC) e as chaves grátis (TMDB recomendada; Gemini, YouTube e
  SteamGridDB opcionais). O nome e a foto aparecem no topo. Dá para rever em Configurações → Ver
  as boas-vindas de novo. Fotos autorais: `public/avatars/avatar-NN.png` (512×512). A foto padrão
  (pedido do Bruno) é o logo do Laaazy, o controle dormindo: aparece no topo e já vem marcada nas
  boas-vindas para quem ainda não escolheu outra.
  Vêm junto três fotos autorais em estilo anime (gamers com o moletom do Laaazy).
- **Cor do Laaazy (pedido do Bruno):** em Configurações → Cor do Laaazy, quatro temas: Azul com
  efeito (o de sempre, padrão), Preto com efeito (ondas e partículas prateadas), Preto e vermelho
  com efeito e Preto moderno com azul (liso, sem efeito). Muda na hora e fica salvo.
- **Start pausa a prévia e R1/L1 andam pelas abas (pedido do Bruno):** no Início, Start pausa a
  prévia do trailer (aparece "Pausado") e Start de novo continua. Em Início, Biblioteca, Apps e
  Buscar, R1 vai para a aba da direita e L1 volta.
- **Mouse melhor em Início, Biblioteca, Apps e Buscar (pedido do Bruno):** as fileiras ganharam
  setas ‹ › nas pontas para andar para o lado com o mouse (somem quando você usa o controle). Buscar
  agora mostra as abas, então dá para sair dela com um clique. O botão "voltar" do mouse (o de lado)
  faz o mesmo que o ○.

- **Atualização pelo GitHub (pedido do Bruno):** quem instalou pelo `Laaazy-Setup` vê, ao abrir o
  Laaazy, "Nova versão X.Y.Z · Atualizar agora / Depois". Atualizar baixa o instalador da release do
  GitHub, confere a impressão digital (SHA-256) e instala sem janelas; o Laaazy fecha e abre de novo
  atualizado. O portátil só avisa e abre a página da versão. Para publicar: `pnpm release` prepara os
  arquivos e as notas, e a release é criada na página do GitHub.

### Corrigido
- **○ no menu do jogo perdia a borda:** fechar o menu da Biblioteca com o ○ deixava a tela sem
  seleção; agora a borda volta para o jogo.
- **Remover jogo pelo controle (achado pelo Bruno):** remover da Biblioteca só dava com o botão direito
  do mouse, e só para jogos de "Meu PC". Agora o △ num jogo abre um menu com Perfil do controle e
  Remover da Biblioteca (com confirmação), e o botão direito abre o mesmo menu. Jogos da Steam e da Epic
  também podem sair: como o Laaazy acha esses no disco, eles ficam ocultos (inclusive os que tiveram a
  pasta apagada na mão e continuavam aparecendo).
- **Cursor do mouse invisível:** uma regra antiga escondia o cursor sempre, mesmo usando o mouse.
  Agora ele aparece ao mexer o mouse e só some quando você usa o controle.
- **Navegador de pastas com as pastas certas:** Imagens (novo, ao escolher a foto) e Área de trabalho
  agora vêm do Windows, então funcionam quando estão no OneDrive.
- **Caixa de outra cor atrás do destaque (achado pelo Bruno):** o destaque do Início tinha um fundo
  azul liso que aparecia sobre o papel de parede. Agora, parado no topo, o papel de parede aparece
  inteiro; ao rolar, uma faixa da largura da tela esconde as fileiras que passam por baixo.

### Mudou
- Sai o botão "Abrir a pasta dos perfis".

## 3.5.0 — 2026-10-09

### Mudou
- **Sai o DS4Windows, entra o Laaazy-pad:** os perfis do controle agora são do Laaazy-pad, um
  programa próprio que funciona com qualquer controle (DualShock 4, 8BitDo, Xbox…). Ele é
  instalado à parte (em `%LOCALAPPDATA%\Programs\Laaazy-pad`), abre junto com o Laaazy, fica
  aberto o tempo todo e fecha quando o Laaazy fecha. Troca de perfil em ~300 ms (o DS4Windows
  pedia 5 s depois de abrir).
- **Só dois perfis, Jogos e PC:** Jogos (o jogo lê o controle direto; o touchpad move o mouse) e
  PC (o controle vira mouse; Share abre o teclado por cima, L2/R2 mudam o volume). Nos dois, o
  PS volta ao Início. Menu, Teclado por cima e jogos vêm em Jogos; streamings, navegadores e
  Área de trabalho em PC. Perfis salvos com nomes antigos (ex.: "Brunera") aparecem como "não
  encontrado": é só escolher Jogos ou PC de novo em Perfis do controle.
- **Perfis do controle:** "Abrir o DS4Windows" virou "Abrir a pasta dos perfis", e a ajuda
  explica os dois perfis. O card "DS4Windows" passa a se chamar "Perfis do controle".
- **Configurações:** "Pasta do DS4Windows" virou "Pasta do Laaazy-pad", e sai o "Fechar o
  DS4Windows ao apertar PS" (o Laaazy-pad não atrapalha a leitura do controle no menu, então
  fica aberto e o PS funciona sempre).
- **Atalhos:** saem as teclas F19 a F24, que o DS4Windows mandava. Ficam Ctrl+Alt+Home (PS),
  Ctrl+Alt+K (teclado por cima), Ctrl+Alt+↑/↓/M (volume) e Ctrl+Alt+End (fechar o da frente).

## 3.4.0 — 2026-10-08

### Mudou
- **Teclado novo (pedido do Bruno, com o do Hydra de referência):** preto, letras grandes para
  ler de longe, Enter alto à direita e Espaço largo embaixo. Cada tecla de atalho mostra o botão
  do controle: **R2** Enter (pesquisa no site e fecha o teclado), **□** apaga (segurando, vai
  apagando tudo), **△** espaço, **L1/R1** andam com o cursor (barrinha amarela). Vale para o
  teclado do Laaazy e para o teclado por cima do Edge. Numa TV com escala maior, as teclas
  encolhem para caber na janela.
- **L2 é o Caps Lock no teclado:** maiúsculas até apertar de novo (a tecla Caps fica amarela).
- **Prévia do trailer maior no Início:** o destaque cresce com a tela (na de 1080p, a prévia
  passou de 626×352 para 833×469) e a primeira fileira continua à vista.
- **Teclado por cima em tempo real:** cada tecla (letra, espaço, apagar, limpar) vai na hora
  para o campo do site — a busca da Crunchyroll já vai mostrando os resultados enquanto você
  digita. R2 aperta Enter (pesquisa) e fecha; Options e O só fecham. O Laaazy só digita
  enquanto a janela da frente for a mesma em que você abriu o teclado.
- **Controle sem mouse enquanto o teclado está aberto (ideia do Bruno):** ao abrir o teclado por
  cima, o DS4 troca para o perfil "Teclado por cima" (Brunera por padrão: X é X, nada de mouse) e,
  ao fechar, volta ao perfil do app aberto (PC na Crunchyroll). Trocável em Perfis do controle.

### Corrigido
- **Duas janelas do mesmo streaming (achado pelo Bruno):** um X a mais enquanto o Edge ainda abria
  abria outra janela, e o PS só fechava uma. Agora o mesmo serviço pedido de novo nos segundos em
  que ele está abrindo é ignorado.
- **Laaazy não abria mais pelo atalho (achado pelo Bruno):** depois de usar o teclado por cima e
  fechar o Laaazy, a janela escondida do teclado deixava o programa rodando sem janela, e clicar
  no atalho caía nele. Agora fechar a janela principal encerra o Laaazy de verdade.
- **Parecidos (△) "não fazia nada" (achado pelo Bruno):** o Gemini levava ~20s e o aviso ficava
  numa fileira escondida atrás do destaque. Agora o aviso aparece no destaque, a IA pensa menos
  (3 a 11s nas medições) e, quando os parecidos chegam, o foco vai para o primeiro deles. Com o
  foco fora de um título (app, jogo), o △ explica o que fazer em vez de ficar em silêncio.
- **Teclado por cima do Edge não digitava no site:** o texto só ia no Pronto e se perdia
  enquanto o site reselecionava o campo (busca da Crunchyroll, por exemplo). Agora cada tecla
  vai na hora, com o campo sempre selecionado.
- **Busca do site fechava ao abrir o teclado por cima (achado pelo Bruno):** o teclado pegava o
  foco do Windows, o Edge perdia o foco e sites como a Crunchyroll fecham a busca nessa hora. Agora
  o teclado aparece por cima **sem tirar o foco do Edge** (o controle continua sendo lido) e a
  tecla atual ganha a borda amarela desenhada pelo próprio Laaazy.
- **Busca perdia a seleção com o Ctrl+Alt+K / Share:** o Ctrl e o Alt do atalho chegavam ao
  Edge, e um Alt solto sozinho leva o foco para o menu do navegador. Agora o Laaazy aperta uma
  tecla neutra na hora do atalho e o campo continua selecionado.
- **Share no Edge voltava ao Início:** o teclado por cima é uma janela do Laaazy, e a volta
  automática achava que você tinha saído do Edge. Agora ela pausa enquanto o teclado está aberto.
- **Teclado parava depois da 1ª tecla (perfil PC):** o X também é clique do mouse e, com o
  cursor em cima do Edge, o clique tirava o foco do teclado. Agora, com o teclado aberto, o
  cursor fica preso dentro dele e é solto quando ele fecha.

## 3.3.0 — 2026-10-08

### Novo
- **Instalador para Windows 10 e 11 (x64):** além do `.exe` portátil, agora há um instalador
  por usuário (sem pedir administrador), com atalhos na Área de trabalho e no Menu Iniciar
  e desinstalador.
- **Logo do Laaazy:** um controle dormindo na cama. Aparece no `.exe`, na janela, na barra de
  tarefas, no Alt+Tab e no GitHub. `pnpm icons` gera todos os tamanhos a partir de
  `docs/assets/logo.svg`.
- **Energia:** desligar daqui a 3 horas ou 2 horas (agendado no próprio Windows, vale mesmo
  com o Laaazy fechado; mostra a hora) e cancelar o desligamento. Tudo que mexe no PC
  pergunta "Você tem certeza?" com Sim / Não.

- **Trailers dublados e legendados (YouTube):** com uma chave grátis da YouTube Data API em
  Configurações, o Início procura "‹título› trailer dublado/legendado" no YouTube, fica só com
  vídeos que são mesmo o trailer do título (sem reações nem análises), prefere dublado e
  canais oficiais do Brasil, e mostra o selo "🇧🇷 Trailer dublado" na prévia. Cada título é
  buscado uma vez e guardado por 30 dias; até 90 buscas por dia.

### Mudou
- **Mouse preso na tela do Laaazy** enquanto ele está na frente (não escapa para outro monitor);
  solta ao abrir o Edge, um jogo ou a Área de trabalho. Desligável em Configurações.
- **Controle e mouse sem brigar:** a borda só segue o mouse quando ele anda de verdade (a tela
  rolar embaixo do cursor parado não rouba mais o foco). Usando o controle o cursor some;
  mexendo o mouse ele volta.
- **Analógico como mouse (perfil PC) não move mais a seleção:** o Laaazy também lia o
  analógico e pulava a seleção e rolava a tela enquanto você mirava com o cursor, e os cliques
  caíam no lugar errado. Agora o analógico só navega com o mouse parado; o D-pad navega sempre.
- **Prévia do trailer só quando você aperta:** no Início, parar num título só mostra as
  informações dele. 1º aperto (X ou clique) toca a prévia; 2º aperto no mesmo título abre
  onde assistir. Passar por cima de outros títulos (mouse, analógico, D-pad) não cancela a
  prévia; só um aperto em outro título troca. Quando uma prévia que você pediu
  acaba, a do próximo título começa. Com a prévia desligada, o 1º aperto já abre.

### Removido
- **"Pedir à IA" da Busca.** O Gemini continua no "Parecido com este" (△ no Início); a Busca
  fica com a busca normal e o Explorar sem digitar.

### Corrigido
- **PS fechava o próprio Laaazy:** com o terminal do "pnpm app" (ou o app que abriu o Laaazy)
  na frente, o PS fechava esse programa com tudo o que ele abriu — inclusive o Laaazy. Agora
  quem abriu o Laaazy nunca é fechado pelo PS.
- **Crunchyroll com tela preta no Edge:** nova opção "Aceleração de vídeo no Edge" por serviço
  (Configurações). Desligada, o Edge abre sem GPU num perfil separado; já vem desligada para a
  Crunchyroll (entre na conta uma vez nesse modo).
- **Trailer tocando atrás do Edge:** apertar 2x (ou "Assistir") abre o streaming e para a
  prévia; o Laaazy sair da frente (Edge, jogo, Área de trabalho) também para.
- **X do controle no perfil PC:** o DS4Windows transforma o X em clique do mouse, e o
  Laaazy também lia o X — um aperto virava dois cliques (liga/desliga voltava ao que era,
  título abria direto). Agora, usando o controle, só o X aperta o item com a borda (cliques
  do mouse gerados pelo DS4Windows são ignorados); mexendo o mouse, só o mouse clica.
- **Padrão dos jogos** salvo por versões antigas (chave "Jogos") voltou a valer.
- **Trailer indisponível:** o Início tenta até 5 trailers de cada título (português primeiro);
  se o YouTube não deixar tocar um, passa para o próximo. Séries sem trailer no cadastro geral
  usam o da 1ª temporada.
- O destaque com o trailer fica preso no topo enquanto você navega por Séries e Animes.

## 3.2.0 — 2026-10-05

### Novo
- **Área de trabalho (Início, depois dos apps):** o controle vira mouse (perfil "PC", trocável
  em Perfis do controle) e o Laaazy é minimizado. O PS traz de volta ao Início sem fechar
  o que estiver aberto na área de trabalho.
- **Início com fileiras de Filmes, Séries e Animes, sorteadas:** cada vez que o Início abre
  aparecem outros títulos (sorteio de até 100 por tipo nos seus apps), e o botão
  **↻ Outros títulos** sorteia de novo na hora. Animes saíram da fileira de séries.
- **Parecido com este (△ no Início):** num filme ou série, aperte △ e aparece no topo uma
  fileira com o mesmo clima ("suspense lento e frio"), não só o mesmo gênero. O Gemini
  sugere, o TMDB confere cada título. Sem a chave do Gemini, usa as recomendações do TMDB.
- **Pedir à IA (Gemini 3.8 Flash):** na busca, escreva o que quer ver ("comédia leve, menos
  de 1h30, na Netflix", "algo parecido com Duna") e aperte ✨ Pedir à IA. O Gemini só
  traduz o pedido em filtros; os títulos vêm do TMDB. Chave grátis do Google AI Studio,
  colada em Configurações; modelo configurável; até 50 pedidos por dia.
- **Perfil do controle por jogo:** na Biblioteca, △ num jogo escolhe o perfil do DS4Windows
  daquele jogo; "Jogos (padrão)" vale para os outros. O perfil entra ao abrir o jogo.
- **Teste do botão PS** em Perfis do controle.

### Mudou
- **Botão PS fecha o jogo** (ou o Edge) à força, fecha o DS4Windows e volta ao Início.
  Dá para trocar para "como console" (só volta ao Início) em Configurações.
- **O Laaazy volta sozinho** para a frente quando o jogo ou o Edge fecha, e o controle
  funciona sem precisar clicar com o mouse.
- **Edge sem InPrivate:** os streamings abrem em tela cheia com um perfil próprio que
  guarda os logins.

### Pequenas melhorias
- Netflix, Prime Video, HBO Max, YouTube e Spotify usam o perfil **PC** do DS4Windows por
  padrão (no Edge o controle precisa de mouse). Quem já escolheu outro perfil continua com ele.
- Colar a chave no campo errado (ex.: a do Gemini no campo do TMDB) agora avisa qual chave é.

### Pacote
- O `.exe` portátil ficou menor (149 → 102 MB): não leva mais o `node_modules`, que a tela
  pronta não usa. `pnpm dist` confere sozinho se o pacote tem tudo e nada a mais.

### Segurança
- Os canais internos só atendem a tela do Laaazy e o teclado por cima; sites de streaming só
  mandam os comandos do controle. A tela tem política de conteúdo (CSP), não navega para fora
  e não abre janelas. Câmera, microfone, localização e afins ficam negados.

### Corrigido
- **Jogos da Steam que não abriam:** o Laaazy sai da frente ao abrir um jogo (o Windows deixava
  o jogo abrir atrás dele) e volta sozinho quando o jogo fecha, ou depois de 90 s se ele não
  aparecer. Jogos baixando ou com instalação incompleta não aparecem mais na Biblioteca.

## 3.1.0 — 2026-10-04

### Novo
- **Capas para todos os jogos:** jogos da Epic e do PC ganham capa pelo SteamGridDB
  (chave grátis, configurada em Configurações como a do TMDB).
- **Volume pelo controle:** L2 abaixa e R2 aumenta. Com o Edge ou um jogo na frente,
  mapeie F20 (silenciar), F21 (abaixar) e F22 (aumentar) no DS4Windows. No teclado:
  Ctrl+Alt+↑, ↓ e M.
- **Novos episódios:** a fileira "Novos episódios" no Início avisa quando uma série da
  Minha lista teve episódio nos últimos 7 dias ou terá nos próximos 7.
- **Proteção de tela:** depois de alguns minutos parado (padrão 10; dá para mudar ou
  desligar em Configurações), mostra imagens dos filmes e séries em alta com o relógio.

## 3.0.0 — 2026-10-04

O antigo **Lazy PS4** agora se chama **Laaazy**.

### Novo
- **Início com filmes e séries** em alta nos seus serviços (Netflix, Prime Video, HBO Max,
  Crunchyroll), com destaque, sinopse, "Assistir na …" e trailer. Usa o catálogo do TMDB:
  cole a sua chave grátis em Configurações.
- **Abas Início · Biblioteca · Apps.** Em Apps você escolhe quais apps ficam fixados no Início.
- **Busca unificada** (□ ou aba ⌕ Buscar): filmes, séries, jogos e apps num lugar só.
- **Teclado na tela:** digite com o controle (X num campo; □ apaga, △ espaço, O fecha).
- **Continuar jogando:** os jogos abertos por último aparecem no Início.
- **Minha lista:** salve filmes e séries para ver depois.
- **Energia de verdade:** fechar o app, suspender ou desligar o PC (com confirmação) e
  opção de abrir junto com o Windows.
- **Configurações:** pasta do Edge e do DS4Windows, onde abrir cada serviço, status do
  Widevine e chave do TMDB.

### Mudou
- Todos os streamings abrem no Edge em tela cheia por padrão (Netflix dava erro E100
  dentro do app). Dá para trocar por serviço em Configurações.
- O controle navega por todas as telas indo para o item mais próximo na direção apertada.
- Ícones decorativos que não faziam nada saíram; relógio e nome do usuário são reais.

### Corrigido
- Atalhos `.lnk` de jogos não abriam.
- Options e PS juntos disparavam duas vezes.
- O caminho do DS4Windows era fixo de um único PC.
- Endereço malformado no app podia derrubar a tela.
- Perfil do DS4 inexistente era salvo mesmo dando erro.
- O `.exe` gerado não incluía arquivos necessários e quebraria ao abrir.

### Atenção ao atualizar
- As configurações, os jogos adicionados e os perfis do DS4 do Lazy PS4 são copiados
  automaticamente. A **chave do TMDB precisa ser colada de novo** (ela é criptografada
  com uma chave da pasta antiga).
