# Roteiro de teste manual

O que os testes automáticos não cobrem (Electron, Windows e programas de verdade).
Rodar com `pnpm app` ao fim de cada fase e antes de gerar o `.exe` (`pnpm dist`).

Marque cada item com ✅ ou ❌ e anote o que aconteceu.

## Menu
- [ ] App abre em tela cheia, e o Laaazy-pad (LaaazyPad.exe) abre junto, sem janela
- [ ] Primeira vez como Laaazy: jogos adicionados, perfis do DS4 e configurações da versão antiga continuam lá (a chave do TMDB precisa ser colada de novo)
- [ ] D-pad/analógico ← → move entre os cards; X abre o card
- [ ] ↑ leva ao cabeçalho; ← → entre Controle, Configurações e Energia; ↓ volta aos cards
- [ ] Controle abre "Perfis do controle"; Configurações abre "Configurações"; Energia fecha o app
- [ ] Relógio mostra a hora certa; nome e inicial são os do usuário do Windows
- [ ] Rodapé do menu mostra só "Confirmar"

## Botão PS e fechar o que está na frente
- [ ] Com um jogo/site aberto, PS (Ctrl+Alt+Home vindo do Laaazy-pad) traz o menu para a frente
- [ ] Por cima do Steam, o menu continua na frente
- [ ] Ctrl+Alt+End fecha o programa da frente e volta ao menu
- [ ] Ctrl+Alt+End com o Steam/Explorer na frente NÃO fecha eles
- [ ] Fechar o Laaazy fecha o Laaazy-pad junto (o LaaazyPad.exe some do Gerenciador de Tarefas em poucos segundos)

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

## Perfis do controle (Laaazy-pad)
- [ ] Tela preta com abas Jogos, PC e "Em cada app"; L1/R1 trocam a aba; o status mostra o perfil ativo agora
- [ ] Escolher um botão na lista (ou no desenho) abre "Editar"; o botão fica amarelo no desenho
- [ ] "Escolher apertando o botão no controle": o próximo botão apertado (inclusive ✕ e ○) é o escolhido, sem clicar nem voltar
- [ ] Mudar para Tecla (comum ou "Gravar atalho no teclado"), Clique ou Nada: salva e, no perfil ativo, vale na hora
- [ ] PS (nos dois) e Share/L2/R2 (no PC) aparecem com ● e "Comando fixo do Laaazy"; não dá para mudar
- [ ] Depois de salvar um perfil, existe `<Nome>.json.bak` com o original na pasta de perfis do Laaazy-pad
- [ ] X numa linha troca o perfil e mostra a confirmação
- [ ] Abrir um card aplica o perfil configurado; voltar ao menu aplica o do Menu

## Configurações
- [ ] Cor do Laaazy: ✕ passa por Azul com efeito → Preto com efeito → Preto e vermelho com efeito → Preto moderno com azul; muda na hora e continua depois de reabrir o app
- [ ] Pasta do Edge: escolher pasta sem msedge.exe mostra erro; pasta certa salva
- [ ] Pasta do Laaazy-pad: idem com LaaazyPad.exe
- [ ] Chrome e Firefox abrem (se não achar, pergunta a pasta)
- [ ] Loja Hydra abre

## Filmes e séries (TMDB)
- [ ] Configurações → colar uma chave errada → "O TMDB recusou essa chave" e nada é salvo
- [ ] Colar a chave certa (API Read Access Token) → "Chave salva"; o campo esvazia
- [ ] `%APPDATA%\Laaazy\secrets.json` NÃO mostra a chave em texto
- [ ] Reabrir o app → Configurações continua dizendo "Chave do TMDB configurada"
- [ ] "Remover a chave do TMDB" → volta para "Sem chave"
- [ ] (fase 11) Início mostra séries e filmes em alta dos seus serviços, com prévia

## Teclado na tela
- [ ] X num campo de texto (busca da Biblioteca, chave do TMDB) abre o teclado
- [ ] Teclado preto, letras grandes (dá para ler do sofá); cada tecla de atalho mostra o botão (□ △ L1 R1 R2)
- [ ] Letras entram no campo; Shift deixa a próxima maiúscula; □ apaga; segurar □ vai apagando tudo; △ dá espaço
- [ ] L1/R1 andam com a barrinha amarela do cursor; a letra entra onde a barrinha está
- [ ] L2 liga o Caps Lock (tecla Caps amarela, todas as letras maiúsculas); L2 de novo desliga
- [ ] Campo de senha mostra bolinhas no teclado
- [ ] R2 (Enter) ou O fecha e o foco volta ao campo

## Busca
- [ ] □ no Início ou em Apps (ou a aba ⌕ Buscar) abre a busca com o campo em foco
- [ ] Digitar "net" mostra o app Netflix; o nome de um jogo mostra o jogo
- [ ] Com a chave do TMDB, um filme aparece em "Filmes e séries"; X abre no serviço onde ele está (ou avisa que não está nos seus)

## Continuar jogando e Minha lista
- [ ] Abrir um jogo e voltar: ele aparece em "Continuar jogando" no Início (mais recente primeiro)
- [ ] "＋ Minha lista" no destaque salva o título; aparece na fileira "Minha lista" e o botão vira "✓ Na Minha lista"
- [ ] Apertar de novo tira da lista; reabrir o app mantém a lista

## Energia
- [ ] Ícone Energia abre o menu: Fechar o Laaazy, Suspender, Desligar, Cancelar
- [ ] Suspender/Desligar pedem confirmação; Cancelar volta sem fazer nada
- [ ] (Teste com cuidado) Suspender confirmado suspende o PC. Se a hibernação estiver ligada no Windows, ele hiberna
- [ ] Configurações → Abrir junto com o Windows = Sim; reiniciar o PC abre o Laaazy (no .exe portátil, o .exe precisa continuar na mesma pasta)

## Capas dos jogos (SteamGridDB)
- [ ] Configurações → Capas dos jogos: chave errada é recusada; chave certa é salva
- [ ] Biblioteca: jogos da Epic e do PC ganham capa (até 10 por vez; os outros na próxima abertura)
- [ ] Jogos da Steam continuam com a capa da Steam

## Volume
- [ ] No Laaazy: L2 abaixa, R2 aumenta o volume do Windows
- [ ] Ctrl+Alt+↑/↓/M funcionam mesmo com o Edge na frente
- [ ] No perfil PC (Edge), L2/R2 mudam o volume (Ctrl+Alt+↓/↑)

## Novos episódios
- [ ] Com uma série em exibição na Minha lista, aparece a fileira "Novos episódios" com o aviso (episódio novo / data do próximo)
- [ ] Séries sem episódio recente ou próximo não aparecem nessa fileira

## Proteção de tela
- [ ] Configurações → Proteção de tela cicla Desligada / 5 / 10 / 15 / 30 min
- [ ] Parado pelo tempo escolhido: aparecem imagens dos filmes/séries em alta e o relógio (sem chave do TMDB: só o relógio)
- [ ] Qualquer botão, tecla ou mexida no mouse volta, sem clicar em nada por engano
- [ ] Com o teclado na tela ou o menu Energia abertos, a proteção não liga

## Chave do Gemini (Parecido com este)
- [ ] Configurações → Parecido com este (Gemini): chave errada é recusada; chave certa é salva e mostra "Restam 50 de 50 pedidos hoje"
- [ ] Modelo do Gemini mostra gemini-3.8-flash; nome inválido (com espaço ou barra) é recusado
- [ ] Busca não tem mais o botão ✨ Pedir à IA

## Voltar ao Laaazy
- [ ] Abrir um jogo e fechá-lo (pelo próprio jogo): o Laaazy volta sozinho para a frente, no Início, e o controle funciona SEM clicar com o mouse
- [ ] Abrir um streaming no Edge e fechar com Alt+F4: idem
- [ ] Enquanto o Steam ainda está abrindo o jogo, o Laaazy NÃO puxa o foco de volta

## Botão PS
- [ ] Perfis do controle → Testar o botão PS → apertar PS em 15s mostra "✓ O PS está funcionando"
- [ ] Se o PS não chegar em 15s, aparece a explicação (controle conectado? Laaazy-pad aberto?)
- [ ] Com um jogo aberto, PS fecha o jogo À FORÇA e volta ao Início, com o controle funcionando sem clicar; o Laaazy-pad continua aberto
- [ ] Com um streaming no Edge, PS fecha o Edge e volta ao Início
- [ ] Configurações → Botão PS fecha o jogo = Não: PS só volta ao Início com o jogo aberto

## Perfil do controle por jogo
- [ ] Biblioteca: △ num jogo abre a lista de perfis (Jogos, PC); escolher mostra 🎮 <perfil> no card
- [ ] Abrir esse jogo aplica o perfil escolhido (confira com `LaaazyPadCmd.exe -command Query.1.ProfileName`)
- [ ] Perfis do controle → "Jogos (padrão)": jogos sem perfil próprio usam esse
- [ ] O fecha a lista sem mudar nada; o foco volta ao card

## Início: filmes no topo e prévia
- [ ] Ao abrir, o foco já está no primeiro filme/série; as fileiras de títulos vêm logo abaixo do destaque
- [ ] A prévia ocupa quase metade da largura (em 1080p, ~833×469) e a primeira fileira aparece inteira
- [ ] Parado num título ~1s, o trailer toca sem som no quadro do destaque; passar para o próximo troca a prévia
- [ ] Se aparecer erro do YouTube no quadro (ex.: 153), me avise e desligue em Configurações → Prévia do trailer
- [ ] "Trailer com som" abre o trailer completo no Edge
- [ ] X três ou mais vezes num título: abre uma janela só do streaming; o PS fecha ela e volta ao Início
- [ ] △ num título: aparece no destaque "Procurando títulos parecidos..."; em poucos segundos a fileira "Parecido com" surge e o foco vai para ela
- [ ] △ num card de app: aparece "Para ver parecidos, pare num filme ou série e aperte △"
- [ ] Continuar jogando e Seus apps ficam mais abaixo
- [ ] "🔇 Trailer sem som" / "🔊 Trailer com som" liga e desliga o som da prévia na hora, sem abrir o Edge; a escolha vale para as próximas prévias
- [ ] Quando o trailer acaba, a prévia passa sozinha para o próximo título (e o foco vai junto)
- [ ] "Assistir na <serviço>" abre o serviço no Edge
- [ ] Com a prévia tocando, Start pausa (aparece "⏸ Pausado") e Start de novo continua; passar para outro título tira o "Pausado"
- [ ] R1 vai Início → Biblioteca → Apps → Buscar (para em Buscar); L1 volta até o Início

## Teclado por cima do Edge
- [ ] Crunchyroll → clicar na busca → Ctrl+Alt+K (ou Share): o teclado abre com a borda amarela numa tecla; o D-pad anda.
- [ ] Cada tecla aparece na hora na busca da Crunchyroll (e o Apagar apaga na hora).
- [ ] L1/R1 andam com o cursor dentro da busca do site; □ apaga a letra antes dele (segurando, apaga tudo).
- [ ] R2 aperta Enter no site (pesquisa) e fecha o teclado; Options e O só fecham. O texto continua na busca.
- [ ] Com o teclado aberto o controle fica no perfil Jogos (X não clica, analógico não mexe o mouse); ao fechar volta ao PC.
- [ ] No perfil PC, o Share abre o teclado por cima (Ctrl+Alt+K)
- [ ] No Edge (ex.: Netflix), selecionar o campo de busca, apertar o botão: o teclado do Laaazy aparece na metade de baixo da tela
- [ ] Digitar com o controle e apertar R2 (Enter) ou Options: o teclado some e o texto está no campo do Edge
- [ ] Campo de senha: 🙈 Ocultar mostra bolinhas no teclado; a senha é digitada certinha
- [ ] Texto com acento (ç, ã, é) sai certo; o que estava copiado antes continua copiado depois
- [ ] O cancela sem digitar nada

## Explorar sem digitar (Busca)
- [ ] Busca → Explorar sem digitar: escolher Tipo, Categoria, Duração e Ordenar só com o controle
- [ ] Os resultados mudam a cada escolha e são só dos seus serviços
- [ ] Categoria Terror com Tipo Tudo: só filmes (o TMDB não tem terror para séries)
- [ ] Mais recentes: nenhum título que ainda vai lançar
- [ ] X num título abre no serviço onde ele está

## Escolher jogo/pasta com o controle
- [ ] Biblioteca → Adicionar jogo: abre o navegador do Laaazy com Downloads, Área de trabalho, Arquivos de Programas e os discos
- [ ] D-pad anda; X entra na pasta; "‹ Pasta de cima" volta; O fecha
- [ ] Só aparecem pastas e jogos (.exe / .lnk); X num jogo adiciona e mostra "<nome> adicionado"
- [ ] Adicionar pasta: "✓ Escolher esta pasta" acha os jogos de dentro
- [ ] "Janela do Windows (mouse)" ainda abre a janela antiga

## Borda de seleção e barras de rolagem
- [ ] Mexer o analógico (perfil PC) por cima dos botões: a borda amarela acompanha o cursor.
- [ ] Clicar numa área vazia: a borda continua no item de antes.
- [ ] Biblioteca com muitos jogos: sem barras de rolagem; o rodapé fica no fim da janela.
- [ ] Rodapé: △ e □ com o ícone certo ao lado de cada texto.

## Parecido com este (△ no Início)
- [ ] Num filme ou série, △: aparece "Parecido com X · <clima>" no topo e o foco vai para ela.
- [ ] △ num título dessa fileira puxa outra fileira.
- [ ] Sem a chave do Gemini: a fileira aparece sem o clima (recomendações do TMDB).

## Início sorteado e Animes
- [ ] Fileiras Filmes, Séries e Animes; nenhum anime japonês em Séries.
- [ ] Sair e voltar ao Início: outros títulos. "↻ Outros títulos" sorteia de novo na hora.

## Área de trabalho
- [ ] Início → Seus apps → Área de trabalho: o controle vira mouse (perfil PC) e o Laaazy minimiza.
- [ ] Abrir o Explorer ou um navegador e apertar PS: volta ao Início sem fechar o que estava aberto.

## Jogos da Steam
- [ ] Abrir um jogo da Steam: o Laaazy sai da frente e o jogo aparece.
- [ ] Fechar o jogo: o Laaazy volta sozinho. Jogo que não abre: o Laaazy volta em até 90 s.
- [ ] Jogo baixando na Steam não aparece na Biblioteca.

## Chaves no campo errado
- [ ] Colar a chave do Gemini (AIza…) no campo do TMDB: aviso dizendo que é a do Gemini.

## .exe portátil
- [ ] `pnpm dist` termina com "Pacote OK".
- [ ] Abrir `dist/Laaazy 3.2.0.exe`: Início, Biblioteca, trailer, teclado por cima (Ctrl+Alt+K) e PS funcionam.

## Trailers dublados e legendados (YouTube)
- [ ] Configurações → Trailers (YouTube): colar a chave e salvar → "Chave do YouTube salva".
- [ ] Início: em filmes populares aparece o selo "🇧🇷 Trailer dublado" ou "legendado" na prévia.
- [ ] Voltar ao mesmo título: mesma prévia, e o "Restam N de 90" não cai de novo.

## PS não fecha o Laaazy
- [ ] Rodar `pnpm app`, clicar no terminal (ele fica na frente) e apertar PS: o Laaazy volta ao Início e não fecha.

## Prévia só quando apertar
- [ ] Abrir o Início e andar pelos títulos: nenhum trailer toca sozinho.
- [ ] X num título: a prévia toca. X de novo no mesmo: abre o streaming.
- [ ] Com a prévia tocando, passar o mouse/analógico por outros títulos: a prévia continua.
- [ ] Apertar X em outro título: a prévia troca para ele.
- [ ] Com a prévia com som, apertar X de novo: o streaming abre e o som do trailer para.

## Energia: desligar agendado
- [ ] Energia → Desligar daqui a 2 horas → pergunta com a hora → Sim: mostra "O PC vai desligar às HH:MM" e o Windows avisa.
- [ ] Energia → Cancelar o desligamento → Sim: "Desligamento cancelado." De novo: "Não havia nenhum desligamento agendado."
- [ ] Desligar daqui a 3 horas depois de já ter agendado 2 horas: troca para o novo horário (sem erro).
- [ ] Desligar o PC e Suspender o PC: "Você tem certeza?" com Sim / Não; Não volta ao menu.

## Mouse preso e controle/mouse juntos
- [ ] Com dois monitores: o cursor não sai da tela do Laaazy. Abrir o Edge ou a Área de trabalho: o cursor sai normalmente.
- [ ] Configurações → Prender o mouse na tela do Laaazy → Não: em até 2 s o cursor fica livre.
- [ ] Navegar com o D-pad até as últimas fileiras: o cursor some e a borda não pula para onde o cursor parou.
- [ ] Mexer o mouse/analógico (perfil PC): o cursor aparece e a borda segue o cursor.
- [ ] Perfil PC: mirar com o analógico e clicar (R2/touchpad): a tela não rola nem a seleção pula; o clique abre o que está embaixo do cursor.
- [ ] Perfil Jogos (analógico não é mouse): o analógico navega entre os cards.
- [ ] Mouse de verdade: o cursor aparece ao mexer e some ao apertar o controle
- [ ] Início e Buscar: com o mouse, as fileiras mostram › (e ‹ depois de andar); clicar anda quase uma tela; com o controle as setas somem
- [ ] Buscar mostra as abas (Buscar marcada); clicar em Início/Biblioteca/Apps vai direto
- [ ] Botão "voltar" do mouse (o de lado): de Biblioteca, Apps, Buscar ou Configurações volta; fecha o teclado na tela e o menu de energia; no Início não faz nada

## Aceleração de vídeo no Edge
- [ ] Crunchyroll (aceleração desligada por padrão): abre, pede login uma vez e o vídeo aparece (sem tela preta).
- [ ] Configurações → Aceleração de vídeo no Edge → Crunchyroll: Ligada volta ao perfil normal do Edge.
- [ ] Netflix e os outros continuam abrindo no perfil normal (com os logins de antes).

## Boas-vindas
- [ ] Sem `user.json` (primeira vez), o Laaazy abre nas boas-vindas, com o foco em "Começar"
- [ ] Introdução: logo, texto, quem fez com o botão do GitHub (abre github.com/BrunoVsc09) e o hardware recomendado
- [ ] ✕ avança, ○ volta um passo; os pontinhos do topo mostram o passo
- [ ] Perfil: ✕ no campo abre o teclado; o nome é salvo ao continuar; as fotos autorais aparecem; "+" abre o navegador de arquivos (só pastas e PNG/JPG) e a foto escolhida aparece marcada
- [ ] Cor: escolher um tema muda na hora
- [ ] Controle: mostra se o Laaazy-pad está aberto e o perfil agora
- [ ] Chaves: "Colar e salvar" com uma chave copiada testa e liga; a etiqueta vira "ligada"
- [ ] "Ir para o Início": o topo mostra o nome e a foto; reabrir o app não mostra as boas-vindas de novo
- [ ] Configurações → Ver as boas-vindas de novo: abre do começo
