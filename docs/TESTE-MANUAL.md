# Roteiro de teste manual

O que os testes automáticos não cobrem (Electron, Windows e programas de verdade).
Rodar com `pnpm app` ao fim de cada fase e antes de gerar o `.exe` (`pnpm dist`).

Marque cada item com ✅ ou ❌ e anote o que aconteceu.

## Menu
- [ ] App abre em tela cheia, com o DS4Windows abrindo minimizado
- [ ] D-pad/analógico ← → move entre os cards; X abre o card
- [ ] ↑ leva ao cabeçalho; ← → entre Controle, Configurações e Energia; ↓ volta aos cards
- [ ] Controle abre "Perfis do controle"; Configurações abre "Configurações"; Energia fecha o app
- [ ] Relógio mostra a hora certa; nome e inicial são os do usuário do Windows
- [ ] Rodapé do menu mostra só "Confirmar"

## Botão PS e fechar o que está na frente
- [ ] Com um jogo/site aberto, PS (F24) ou Ctrl+Alt+Home traz o menu para a frente
- [ ] Por cima do Steam, o menu continua na frente
- [ ] F23 ou Ctrl+Alt+End fecha o programa da frente e volta ao menu
- [ ] F23 com o Steam/Explorer na frente NÃO fecha eles
- [ ] "Fechar o DS4Windows ao apertar PS" = Sim → DS4Windows fecha; = Não → volta ao perfil do Menu

## Streaming (matriz da fase 6)
Para cada serviço, em `pnpm app` e no `.exe` portátil:
vídeo toca ≥ 30s, △ pausa, L1/R1 ±10s, O volta, PS/Options vai ao menu.

| Serviço | Modo | `pnpm app` | `.exe` portátil | Código de erro |
|---|---|---|---|---|
| Netflix | Edge (padrão) | ❌ E100 no app | | E100 (DRM recusado sem VMP) |
| Prime Video | Edge (padrão) | | | |
| HBO Max | Edge (padrão) | | | |
| Crunchyroll | Edge (padrão) | | | |
| YouTube | Edge (padrão) | | | |
| Spotify | Edge (padrão) | | | |

- [ ] Configurações mostra o status do Widevine
- [ ] Trocar o modo de um serviço para "Edge" abre no Edge em tela cheia (Alt+F4 fecha)

## Biblioteca
- [ ] Jogos da Steam e da Epic aparecem (com capa na Steam)
- [ ] Filtros Todos / Steam / Epic Games / Meu PC funcionam
- [ ] □ foca o campo de busca; digitar filtra
- [ ] "Nome: A a Z" alterna para Z a A e continua assim ao reabrir o app
- [ ] Adicionar jogo (.exe) e Adicionar jogo (.lnk) → os dois abrem
- [ ] Adicionar pasta → mostra quantos jogos entraram
- [ ] Clique direito num jogo "Meu PC" remove da lista
- [ ] Jogo cujo .exe foi apagado mostra mensagem de erro
- [ ] O volta ao menu

## Perfis do controle (DS4Windows)
- [ ] Lista os perfis da pasta do DS4Windows
- [ ] X numa linha troca o perfil e mostra a confirmação
- [ ] Abrir um card aplica o perfil configurado; voltar ao menu aplica o do Menu

## Configurações
- [ ] Pasta do Edge: escolher pasta sem msedge.exe mostra erro; pasta certa salva
- [ ] Pasta do DS4Windows: idem com DS4Windows.exe
- [ ] Chrome e Firefox abrem (se não achar, pergunta a pasta)
- [ ] Loja Hydra abre

## Filmes e séries (TMDB)
- [ ] Configurações → colar uma chave errada → "O TMDB recusou essa chave" e nada é salvo
- [ ] Colar a chave certa (API Read Access Token) → "Chave salva"; o campo esvazia
- [ ] `%APPDATA%\lazy-ps4\secrets.json` NÃO mostra a chave em texto
- [ ] Reabrir o app → Configurações continua dizendo "Chave do TMDB configurada"
- [ ] "Remover a chave do TMDB" → volta para "Sem chave"
- [ ] (fase 11) Início mostra séries e filmes em alta dos seus serviços, com prévia
