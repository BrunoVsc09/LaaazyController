# Plano de refatoração — Laaazy (antes Lazy PS4)

## Andamento (2026-10-04)

| Fase | Status |
|---|---|
| 0–5, 7–9 | ✅ concluídas (um commit cada) |
| 6. Streaming e DRM | ✅ modo app/Edge por serviço e status do Widevine. Netflix: erro E100 no `pnpm app` (H2: assinatura VMP de desenvolvimento recusada). A conta castlabs EVS não aceita e-mail pessoal → assinatura VMP descartada; **Todos os streamings passam a abrir no Edge por padrão** (decisão de 2026-10-04); "No app" continua disponível por serviço em Configurações |
| 10. Design | 🟡 protótipo "lazy." (identidade própria, estrutura Início/Biblioteca/Apps) em artifact, fora do projeto · **o design será ajustado futuramente** (decisão de 2026-10-04): não está aprovado e não é a versão final |
| 13. Catálogo de filmes e séries (TMDB) | ✅ dados, chave criptografada e campo em Configurações (seção 7) · a tela de Início com filmes e séries entra na fase 11 |
| 11. Telas novas | ✅ funcional (Início com TMDB, Apps, abas, navegação espacial) no visual provisório · ⏸ aplicar o design final quando ele for ajustado e aprovado |
| 14, 16, 17, 18, 20 | ✅ concluídas (Laaazy, teclado na tela, busca, continuar jogando + Minha lista, energia) |
| 15. Versão 3.0.0 | ✅ versão e CHANGELOG · ⏳ falta o roteiro manual no PC (`docs/TESTE-MANUAL.md`) — o app novo ainda não foi aberto de verdade |
| 19, 21, 22, 23 | ✅ concluídas (capas SteamGridDB, volume, novos episódios, proteção de tela) — versão 3.1.0 |
| 12. Limpeza | ✅ dependências e código mortos removidos, README · ⏸ CSS morto (`.ps4-divider`, `.ps4-live`, `.icon-with-badge`, `.details-command-icon`) sai na fase 11; sons/ícones locais aguardam permissão para baixar |

Bugs: B1–B6 corrigidos, cada um com teste de regressão. Achado na fase 6: o build
não incluía `shared/` (o `.exe` quebraria ao abrir) — corrigido.

Mantidos de propósito: `shadcn` e `tw-animate-css` (importados pelo `globals.css`).

Objetivo: deixar o código limpo, testado e com os bugs conhecidos corrigidos,
**sem mudar o que o app faz** (exceto onde está marcado como decisão).

Método: TDD.
- Código que já funciona → testes de caracterização (passam de cara) → refatorar sem quebrá-los.
- Bug encontrado → teste que falha (RED) → correção (GREEN) → limpeza (REFACTOR). Todo bug vira teste de regressão.

---

## 1. Diagnóstico do código atual

| Problema | Onde |
|---|---|
| `main.js` (344 linhas) mistura janela, protocolo, busca de navegadores, Edge, PowerShell, taskkill e IPC | `electron/main.js` |
| Lógica de negócio presa a `child_process`, `fs` e Electron → impossível testar | `ds4.js`, `games.js`, `main.js` |
| Código duplicado | `resolveEdgeExe`/`resolveExeIn`, `regEdgePath`/`regAppPath`, `readJson`/`readJsonSync`, `focusMove` (page.tsx)/`move` (stream-preload), lista de perfis DS4 (page.tsx e ds4.js) |
| `page.tsx` com 3 telas, loop do controle, sons e catálogo no mesmo arquivo; linhas com 1000+ caracteres | `app/page.tsx` |
| Nomes de canais IPC espalhados como strings soltas | `main.js`, `preload.js`, `games.js`, `ds4.js` |
| `window.lazy` sem tipo (`as any` em todo lugar) | `app/page.tsx` |
| Erros de TypeScript escondidos | `next.config.mjs` (`ignoreBuildErrors: true`) |
| Código e dependências mortas | `components/ui/button.tsx` (ninguém importa), `@vercel/analytics`, `@base-ui/react`, `class-variance-authority`, `shadcn` |
| Configuração inválida | `pnpm-workspace.yaml` (`electron-winstaller: set this to true or false`) |
| Sem git, sem testes | — |

### Bugs conhecidos

| ID | Bug | Status |
|---|---|---|
| B1 | "Adicionar jogo" aceita `.lnk`, mas `spawn` não executa atalhos → jogo entra na lista e não abre | confirmado (leitura do código) |
| B2 | `edge(pad,9) \|\| edge(pad,16)` no stream-preload: se Options dispara, o estado do botão PS não é atualizado → disparo duplo | confirmado |
| B3 | Caminho do DS4Windows fixo em `C:\Users\bruno\Downloads\win-x64\...` | confirmado |
| B4 | `decodeURIComponent` no protocolo `app://` lança exceção com URL malformada (`%E0`) em vez de responder 400 | suspeito — confirmar com teste |
| B5 | Setas do teclado mudam o card selecionado mesmo com Biblioteca/Perfis abertos (ao voltar, a seleção "pulou") | suspeito — confirmar com teste |
| B6 | `ds4:set` salva um perfil que não existe na pasta (retorna erro mas grava) | suspeito — confirmar com teste |

---

## 2. Nova arquitetura

### Regra de dependência

```
            ┌──────────────────────────────────────────────┐
            │  main.js  (raiz de composição: só liga peças) │
            └───────┬───────────────┬──────────────┬───────┘
                    │               │              │
              window/            ipc/          adapters/      ← únicos que tocam Electron,
           (Electron puro)   (canal→serviço)  (fs, spawn,       child_process, registro, fs
                    │               │          reg, PowerShell)
                    └──────┬────────┘              │
                           ▼                       │ injetados
                       services/  ◄────────────────┘
                (orquestração; recebe dependências
                 por parâmetro → testável com fakes)
                           │
                           ▼
                        core/         ← funções puras, zero I/O
                           ▲
                        shared/       ← usado pelo Electron E pela interface
```

- `core/` não importa `fs`, `child_process` nem `electron`. Recebe dados, devolve dados.
- `services/` são fábricas `createX(deps)`; nos testes, `deps` são fakes.
- Só `adapters/`, `window/` e `main.js` importam Electron ou executam processos.
- O Electron continua em **JavaScript CommonJS** com `// @ts-check` + JSDoc (sem etapa de build no processo principal).

### Estrutura de pastas

```
electron/
  main.js                    composição: adapters → services → ipc → janela
  window/
    window-manager.js        criar janela, showMenu (briga de foco), tela cheia
    stream-view.js           WebContentsView de streaming (abrir/fechar/voltar/teclas)
    app-protocol.js          handler do app:// (usa core/paths.isInside)
  ipc/
    register.js              liga cada canal de shared/channels.js a um serviço; valida argumentos
  services/
    settings.js              settings.json com chaves conhecidas e padrões
    exe-locator.js           acha um .exe: salvo → caminhos padrão → registro → pergunta a pasta
    launcher.js              Hydra, Chrome/Firefox, Edge kiosk; decide streaming x externo
    library.js               listar (cache 15s) / adicionar / remover / abrir jogos
    ds4.js                   aplicar perfil, ensureRunning, shutdown (fila serial)
    foreground.js            fechar o app em primeiro plano e voltar ao menu
  core/
    paths.js                 resolveExeIn, isInside (path traversal)
    routing.js               isExternalHost, isAllowedGameUrl
    processes.js             isProtected, shouldClose
    queue.js                 fila serial com timeout
    ds4-config.js            mesclar padrões, validar chave/perfil, próximo perfil
    games/
      steam.js               parseLibraryFolders(vdf), parseAppManifest(acf)
      epic.js                parseEpicManifest(json)
      folder.js              escolher melhor .exe, nome do jogo
      merge.js               juntar fontes, tirar duplicados, ordenar
  adapters/
    json-store.js            (o store.js atual) leitura/gravação atômica + backup
    process.js               spawnDetached, execFile, taskkill, tasklist
    registry.js              reg query
    ps-foreground.js         PowerShell residente → {pid, name} da janela da frente
    ds4-cli.js               DS4WindowsCmd: LoadProfile, Query, shutdown
    dialogs.js               escolher pasta/arquivo, caixa de erro
  preload.js                 contextBridge → window.lazy (usa shared/channels.js)
  stream-preload.src.js      fonte do preload dos sites de streaming
  stream-preload.js          GERADO (src + shared/gamepad.js), ver nota abaixo

shared/
  channels.js                nomes de todos os canais IPC
  ds4-keys.js                lista de cards que têm perfil DS4
  gamepad.js                 detector de borda, direção do D-pad/analógico, pickNext (navegação espacial)

app/
  page.tsx                   só escolhe qual tela mostrar
  screens/
    HomeScreen.tsx  LibraryScreen.tsx  Ds4Screen.tsx
  components/
    Header.tsx  Footer.tsx  Tile.tsx  PS4Background.tsx
  hooks/
    useGamepad.ts            loop do controle (usa shared/gamepad.js)
    useSounds.ts
  lib/
    catalog.ts               lista de cards
    screen-state.ts          reducer das telas (home/biblioteca/perfis + transições)
    library-filter.ts        filtro por plataforma e busca
    lazy-api.ts              tipo de window.lazy (contrato único com o preload)

scripts/
  build-stream-preload.js    junta stream-preload.src.js + shared/gamepad.js (sem dependências)
```

**Nota sobre o stream-preload:** ele roda em modo sandbox dentro de sites de terceiros
e só pode fazer `require('electron')`. Para ter uma única implementação da navegação
pelo controle, um script Node simples (sem dependências) gera o arquivo final juntando
os dois fontes. O script roda antes de `app` e `dist`.

### Testes

- Runner: **vitest** (única dependência nova, de desenvolvimento).
- Testes ficam ao lado do código: `queue.js` → `queue.test.js`.
- `core/`: testes puros, sem mocks.
- `services/`: deps falsas (sistema de arquivos em memória, processo falso, relógio falso).
- `adapters/json-store.js`: pasta temporária real (I/O local, não serviço externo).
- Interface: testa só lógica pura (`screen-state`, `library-filter`, `gamepad`). Componentes React ficam no roteiro manual (evita jsdom + testing-library).
- Nunca chama Steam, Epic, DS4Windows, registro ou navegador de verdade nos testes.

### Roteiro de teste manual (`docs/TESTE-MANUAL.md`)
O que não dá para automatizar: foco por cima do Steam, F23/F24, DS4Windows real,
Edge kiosk na Crunchyroll, DRM da Netflix, abrir jogo Steam/Epic, controle nos sites.
Feito na fase 0 com o comportamento atual e repetido ao fim de cada fase.

---

## 3. Fases

Cada fase termina com: todos os testes passando, roteiro manual ok, um commit.

| Fase | Entrega | TDD |
|---|---|---|
| **0. Preparação** | `git init` + commit do estado atual; vitest; script `test`; roteiro manual | — |
| **1. Store** | `adapters/json-store.js`; leitura sync/async compartilhando a mesma validação | caracterização: arquivo ausente, corrompido → `.bak` + aviso, tipo errado, gravação atômica, falha limpa o `.tmp` |
| **2. Localizar programas** | `core/paths.js`, `services/exe-locator.js`, `services/settings.js`; fim da duplicação Edge/Chrome/Firefox; caminho do DS4Windows configurável | RED B3 |
| **3. Biblioteca** | parsers Steam/Epic/pasta em `core/games/`; `services/library.js` | caracterização dos parsers com arquivos sintéticos; RED B1 (`.lnk` abre via `shell.openPath`) |
| **4. DS4** | `core/queue.js`, `core/ds4-config.js`, `adapters/ds4-cli.js`, `services/ds4.js`; `shared/ds4-keys.js` | fila serial e timeout com relógio falso; RED B6 |
| **5. Processo principal** | `core/routing.js`, `core/processes.js`, `window/*`, `ipc/register.js`, `shared/channels.js`; `main.js` vira só composição | caracterização de rotas/PROTECTED/path traversal; RED B4 |
| **6. Streaming e DRM** | vídeo tocando em Netflix, Prime Video, HBO Max, Crunchyroll, YouTube e Spotify — ver seção 6 | modo de abertura por serviço, status do Widevine → mensagem; matriz manual por serviço |
| **7. Controle** | `shared/gamepad.js` usado pelo menu e pelo stream-preload; script de geração | caracterização do `pickNext`; RED B2 |
| **8. Dividir a interface** | dividir `page.tsx`; `screen-state` reducer; hooks; `lazy-api.ts`; desligar `ignoreBuildErrors` e corrigir os erros de tipo | reducer e filtro; RED B5 |
| **9. Interface funcional** | itens da seção 4: remover decorativos, ligar Controle/Configurações/Energia, relógio e usuário reais, dicas por tela, Buscar, ordenar | ordenação, dicas por tela, formato do relógio, □ → buscar |
| **10. Design** | cores, tipografia, espaçamentos e componentes base (card, botão, linha de configuração, rodapé de dicas) | — (visual; revisão manual) |
| **11. Novo visual** | aplicar o design em Menu, Biblioteca, Perfis e Configurações | testes existentes continuam passando |
| **12. Limpeza** | remover `button.tsx` e dependências mortas; corrigir `pnpm-workspace.yaml`; README | build + testes + roteiro manual |

Total: **13 fases (0 a 12)**. As fases 10 e 11 dependem da decisão da seção 5 ("outra face").

Ordem: de baixo (sem dependências) para cima (`main.js` e interface), para que cada
camada refatorada já tenha testes quando a de cima passar a usá-la. O visual vem
depois da interface dividida e testada, para trocar a aparência sem quebrar o funcionamento.

---

## 4. Interface 100% funcional (decidido em 2026-10-04)

Regra: todo botão faz algo real; o que é só decoração e parece clicável sai.

| Item atual | Decisão | Como |
|---|---|---|
| Ícone Controle | **funcional** | abre a tela de perfis do DS4 |
| Ícone Configurações | **funcional** | abre a nova `SettingsScreen` (pasta do Edge, pasta do DS4Windows, "fechar DS4Windows ao apertar PS", que saem da tela de perfis) |
| Ícone Energia | **funcional** | fecha o app (canal `quit`, que já existe e não era usado) |
| Ícones Mensagens (badge "2"), Perfil, Headset, Troféus | **remover** | — |
| Relógio fixo "14:38" | **funcional** | relógio real, atualiza a cada minuto |
| Nome "Bruno" e avatar "B" | **funcional** | nome e inicial do usuário logado no Windows (canal `system:user`) |
| Rodapé "Bruno está online / Biblioteca pronta para jogar" | **remover** | — |
| Dicas do rodapé | **por tela, só comandos reais** | Menu: Confirmar. Biblioteca: Confirmar, Voltar, Buscar. Perfis/Configurações: Confirmar, Voltar |
| Dica "Detalhes" | **remover** | — |
| Dica "Buscar" | **funcional na Biblioteca** | □ (botão 2 do controle) foca o campo de filtro |
| Botão "Nome: A a Z" | **funcional** | alterna A→Z / Z→A; escolha salva em `settings.json` (`librarySort`) |
| Letras de plataforma Ubisoft/Xbox no código | **remover** | caminhos mortos (essas plataformas não são detectadas) |

Mantidos (não são botões, são feedback visual): fundo animado, painel "Iniciar" sob o
card selecionado, aviso "Controle conectado", sons de foco/clique.

Implementado na **fase 9. Interface funcional**, com testes para a lógica
(relógio formatado, ordenação, mapeamento de dicas por tela, botão □ → buscar) e
o restante no roteiro manual.

Arquitetura: entram `app/screens/SettingsScreen.tsx`, `app/components/Clock.tsx`,
`app/lib/footer-hints.ts`, `app/lib/library-sort.ts`, canal `system:user` em
`shared/channels.js`, e `librarySort` em `services/settings.js`.

## 5. Ainda pendente de decisão

- Sons e imagens dos comandos são carregados da internet (Vercel Blob). Sem internet,
  ficam mudos/sem ícone. Trazer para `public/` exige baixar esses arquivos (peço
  permissão antes).
- "Outra face" (fases 10 e 11): PS4 mais caprichado, identidade própria ou outro
  estilo de console (PS5, Xbox, Steam Big Picture). Uma referência visual ajuda.
- Fase 6: código de erro de cada serviço e se o erro aparece em `pnpm app`, no
  `.exe` portátil ou nos dois (define qual caminho da seção 6 seguir).

---

## 6. Fase 6 — Streaming e DRM

**Problema:** a Netflix abre mas não toca o vídeo. A Crunchyroll já foi desviada para
o Edge pelo mesmo motivo. Objetivo: os seis serviços tocando vídeo/música.

### Hipóteses (da mais para a menos provável)

| # | Hipótese | Evidência no código |
|---|---|---|
| H1 | Assinatura VMP invalidada no build portátil: o electron-builder renomeia e altera o `electron.exe`, e não há passo de reassinatura | `package.json` sem `afterPack`/`afterSign`; `.sig` só existe em `node_modules/electron/dist` |
| H2 | Assinatura VMP de desenvolvimento (a que vem com a castlabs) recusada por serviços mais rígidos | Crunchyroll já precisou ir para o Edge |
| H3 | Widevine (CDM) não instalado ou falhou ao baixar no primeiro uso | `components.whenReady()` não verifica o resultado nem avisa |
| H4 | Detecção de navegador não suportado pelo User-Agent | UA tira só `Electron/x`; resto é Chromium da castlabs |
| H5 | Aceleração de hardware | improvável: o app não mexe na GPU; testar com `--disable-gpu` para descartar |

### Passos

1. **Diagnóstico (antes de qualquer código):** para cada serviço, anotar código do
   erro, se falha em `pnpm app` e/ou no `.exe` portátil, e o resultado com
   `--disable-gpu`. Registrar a matriz em `docs/TESTE-MANUAL.md`.
2. **Status do Widevine visível (H3):** `services/drm.js` lê `components.status()` e a
   tela de Configurações mostra "Widevine: instalado vX / não instalado / erro".
   Ao abrir um serviço com DRM sem Widevine, avisa em vez de abrir uma tela que não toca.
3. **Assinatura VMP no build (H1/H2):** passo `afterPack` no electron-builder que roda
   o castlabs EVS (`castlabs_evs.vmp sign-pkg`) na pasta empacotada.
   - Requer conta gratuita no castlabs EVS, criada **por você**; login feito por você
     no terminal. Nenhuma credencial no código ou no repositório.
   - Requer Python + pacote `castlabs-evs` só na máquina que gera o build.
4. **Modo de abertura por serviço (plano B, sempre disponível):** cada card do catálogo
   ganha `mode: 'app' | 'edge'`. A lista fixa `EXTERNAL` sai; o modo vira dado do
   catálogo e pode ser trocado por serviço na tela de Configurações
   (`settings.streamModes`). Serviço que não tocar no app abre no Edge em tela cheia,
   como a Crunchyroll hoje (perfil DS4, botão PS e "fechar o que está na frente"
   continuam funcionando).
5. **User-Agent (H4), só se o diagnóstico apontar:** UA de Chrome estável por serviço.

### Testes (TDD)
- `core/routing.js`: modo efetivo = escolha do usuário → padrão do catálogo; host
  desconhecido → app; subdomínios (`www.netflix.com`) resolvem para o serviço certo.
- `services/drm.js`: status do componente → mensagem; serviço com DRM + Widevine
  ausente → aviso, não abre.
- `services/settings.js`: `streamModes` só aceita serviços do catálogo e `app`/`edge`.
- Manual: matriz serviço × (`pnpm app`, `.exe` portátil) com o vídeo tocando ≥ 30s,
  pausa (△), ±10s (L1/R1), voltar (O) e menu (PS).

### Critério de pronto
Os seis serviços tocam pelo caminho escolhido (app ou Edge), no `.exe` portátil, e
o motivo de cada escolha está registrado na matriz.

---

## 7. Fase 13 — Catálogo de filmes e séries (TMDB)

Fonte: API do TMDB (gratuita, uso pessoal não comercial). O Gemini/Google AI Studio
foi descartado: é IA generativa, não um catálogo — inventaria títulos e serviços.

- **Chave:** colada pelo usuário em Configurações; validada no TMDB antes de salvar;
  guardada criptografada com `safeStorage` (proteção de dados do Windows). Sem
  `safeStorage` disponível, a chave não é salva (nunca em texto puro). Nunca no código,
  no git ou nos logs.
- **Chamadas só no processo principal** (`adapters/tmdb.js`); a tela nunca vê a chave.
- **Domínio independente do TMDB** (`core/catalog.js`): título, tipo, ano, sinopse,
  imagens, serviço, popularidade. Trocar de fonte = trocar o adapter e o mapeamento.
- **"Em alta nos seus apps":** um `discover` por serviço (Netflix, Prime Video, HBO Max,
  Crunchyroll) com `watch_region=BR`, em português; ids dos serviços resolvidos pelo
  nome via `/watch/providers` (não fixados no código).
- **Cache local de 6h**; sem internet, mostra a última lista com aviso.
- **Trailer** sob demanda (`/videos`), preferindo trailer oficial em português no YouTube.
- **Atribuição** exigida pelo TMDB em Configurações.
- Testes só com respostas falsas (fixtures); nunca a API real.

---

## 8. Roadmap 3.0 / 3.1 (planejado em 2026-10-04)

Critério das features: tudo o que deixa o app melhor de usar **do sofá, só com o
controle**. Todas seguem o mesmo método (TDD, um commit por fase, nada de API real
nos testes, chaves de API sempre configuradas no app e guardadas criptografadas).

### Versão 3.0 (proposta)

| Fase | O que entra | Depende de | Esforço |
|---|---|---|---|
| **11. Novo visual + Início com filmes e séries** | aplicar o design (depois de ajustado) em Início, Biblioteca, Apps, Perfis e Configurações; fileiras do TMDB com prévia/trailer; Apps com "fixar no Início"; remover CSS morto. Pode ser dividida em 11a (Início + TMDB) e 11b (demais telas) | 10 (design ajustado e aprovado), 13 | grande |
| **14. Nome novo** | trocar nome, ícone e textos. Mudar o `appId` (`com.bruno.lazyps4`) muda a pasta de dados: a fase migra configurações, chave do TMDB, jogos e perfis para a pasta nova | ⏳ confirmar o nome ("Laaazy"?) | pequeno |
| **16. Teclado na tela** | digitar com o controle (busca, chave de API, nomes); abre ao focar um campo | — | médio |
| **17. Busca unificada (□)** | uma busca para filmes/séries (TMDB), jogos e apps | 16, 13 | médio |
| **18. Continuar jogando + Minha lista** | jogos abertos recentemente no Início (registrados localmente ao abrir); "Minha lista" de filmes e séries salva no PC, sem conta | 13 | pequeno |
| **20. Energia de verdade** | menu do botão Energia: fechar o app, suspender ou desligar o PC, sempre com confirmação; opção "abrir junto com o Windows" | — | pequeno |
| **15. Lançamento 3.0** | versão 3.0.0 (hoje `0.1.0`), roteiro manual completo, `.exe` portátil final, lista de novidades | todas as acima | pequeno |

### Versão 3.1 (proposta)

| Fase | O que entra | Esforço |
|---|---|---|
| **19. Capas para todos os jogos** | capas para jogos da Epic e do PC via SteamGridDB (API gratuita, chave configurada no app como a do TMDB) | médio |
| **21. Volume pelo controle** | aumentar, diminuir e silenciar por atalho global, inclusive com o Edge na frente | pequeno |
| **22. Novos episódios** | aviso no Início quando sai episódio novo de uma série da "Minha lista" (TMDB) | médio |
| **23. Proteção de tela** | após alguns minutos parado, mostra imagens de fundo dos filmes em alta | pequeno |

### Fora do roadmap (de propósito)
- **Perfis da família** (lista e apps por pessoa): mexe em quase todas as telas; candidato à 4.0.
- **Controle pelo celular**: exige servidor na rede local e cuidado de segurança; projeto à parte.
- **Bateria do controle**: nem a Gamepad API nem o DS4Windows expõem isso de forma simples.
- **Atualização automática**: o `.exe` portátil não se atualiza sozinho; exigiria trocar para instalador.

### Pendências pequenas (podem entrar na fase 11)
- Perfil "PC" do DS4Windows como padrão para todos os streamings (no Edge o controle precisa dele).
- Sons e ícones dos comandos guardados dentro do app (precisa de permissão para baixar).
