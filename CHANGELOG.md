# Novidades do Laaazy

## Próxima versão (ainda não lançada)

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
