# CLAUDE.md — como trabalhamos no Laaazy

Laaazy: central de mídia para Windows com cara de console, controlada pelo DualShock 4
(filmes/séries/animes via TMDB, jogos, apps, IA Gemini). Electron (castlabs) + Next.js 16
estático + React 19. Tudo em **português do Brasil** (código comentado, interface, commits).

## 1. Dupla (Extreme Programming)

Trabalhamos em **pair programming**: um pensa, o outro pilota.

- **Bruno = navegador.** Decide o domínio, a arquitetura e o escopo. Define o **esqueleto**
  (em qual contexto entra, nomes, contrato entre as partes) e revisa o resultado.
- **Claude = piloto.** Escreve o código em passos pequenos, sempre com TDD, e mostra o que fez.
- Antes de criar **contexto, módulo, canal IPC ou dependência nova**, o piloto propõe o
  esqueleto em 3–5 linhas e espera o navegador. Dentro de um esqueleto já combinado, segue direto.
- O piloto nunca decide sozinho: publicar algo, apagar dados, mudar a arquitetura, adicionar
  dependência, enviar ao GitHub.
- Programar com IA tem o jeito certo e o errado: o certo é engenharia de software com um
  humano que decide e critica o código (ver Fabio Akita, akitaonrails.com, fev/2026).
  A IA faz o trabalho mundano; as decisões ficam com a dupla.

## 2. Ritual de cada mudança (TDD)

1. **Entender**: ler o código em volta antes de mexer. Achar o contexto certo (seção 4).
2. **Vermelho**: escrever o teste que descreve o comportamento (ou o bug) e ver falhar.
3. **Verde**: o mínimo de código para passar.
4. **Refatorar**: limpar com os testes verdes.
5. **Verificar de verdade**: `pnpm test` + `npx next build`; se mexeu na tela, conferir no
   navegador (out/ com API falsa) ou no app real (DevTools na porta de depuração).
6. **Commit** pequeno e coeso, com mensagem que explica o *porquê*.
7. **Contar ao Bruno** o que foi feito e, com honestidade, o que **não** foi verificado.

Bug? Primeiro um **teste de regressão** que reproduz o bug; depois a correção.

## 3. Pronto (Definition of Done) — disciplina > intuição

- [ ] Teste novo cobrindo o comportamento (bug → teste de regressão)
- [ ] `pnpm test` verde e build sem erro
- [ ] Rodou de verdade (navegador ou app), ou está dito claramente que não rodou
- [ ] Segue as convenções do projeto (nada de "padrão novo" sem combinar)
- [ ] Nada de arquivão: respeita os limites da seção 5
- [ ] CHANGELOG ("Próxima versão") e `docs/TESTE-MANUAL.md` atualizados quando muda algo visível
- [ ] CI/scripts ajustados se a mudança afeta build ou pacote
- [ ] Nenhuma chave, senha ou dado pessoal no código, testes ou logs
- [ ] Commit só com o que pertence a essa mudança (nunca `git add .` de coisas misturadas)

## 4. Domínio (linguagem do projeto)

| Contexto | O que é | Onde mora |
|---|---|---|
| **Mídia** | Título (filme/série/anime), catálogo, prévia do trailer, Parecidos, Minha lista, novos episódios | `core/catalog`, `core/ai-mood`, `core/yt-trailers`, `services/catalog`, `services/assistant`, `services/yt-trailers`, `app/lib/trailer`, `home-model` |
| **Jogos** | Jogo, biblioteca, fontes (Steam/Epic/PC), capas, recentes | `core/games/*`, `core/covers`, `core/fs-browse`, `services/library`, `services/covers` |
| **Controle** | Perfil DS4 por app/jogo, botão PS, modo de entrada (controle × mouse), teclado na tela | `core/ds4-config`, `services/ds4`, `services/ps-button`, `shared/gamepad`, `app/lib/input-mode`, `app/lib/osk` |
| **Sistema** | Janela, foco/volta automática, energia, Área de trabalho, cursor preso, segurança | `core/focus`, `core/power`, `core/processes`, `core/security`, `services/foreground`, `desktop`, `power`, `cursor-lock` |
| **Streaming** | Abrir serviços no Edge, DRM, aceleração | `core/routing`, `core/drm`, `services/launcher`, `shared/streaming` |

Glossário: **prévia** = trailer no destaque · **destaque** (hero) = topo do Início ·
**Parecidos** = △ no Início · **perfil** = perfil do Laaazy-pad (Jogos ou PC) · **modo controle/mouse** =
quem está no comando da tela · **Área de trabalho** = Laaazy minimizado com o controle virando mouse.

## 5. Arquitetura — evitar a big ball of mud

Hexagonal. A dependência sempre aponta **para dentro**:

```
app/ (tela) ──IPC──▶ ipc/register ──▶ services ──▶ core (puro)
                                         └──▶ adapters (I/O)   window/ (Electron)
main.js = raiz de composição (só liga as peças)
```

Regras:
- `core/` é **puro**: sem `fs`, `child_process`, `electron`, `fetch`. Tudo testável sem mock.
- `services/` recebem dependências **por parâmetro** (testes com *fakes*); não fazem I/O direto.
- `adapters/` são finos: tocam o mundo e não têm regra de negócio.
- A tela não tem regra de negócio dentro de componente: regra vai para `app/lib/` (testada).
- Canal IPC novo: `shared/channels.js` → `electron/ipc/register.js` (validar argumentos) →
  `preload.src.js` → `app/lib/lazy-api.ts` → teste no `register.test.js`.
- Um contexto não importa o `services/` ou `adapters/` de outro; conversa via `main.js`.
- **Limites**: arquivo > **300 linhas** ou função > **40 linhas** → dividir antes de crescer.
  Dívida conhecida: `app/screens/HomeScreen.tsx` (~300) e `electron/main.js` (raiz, ~420).
- Sem dependência nova sem combinar (o pacote não leva `node_modules`; o Electron só usa
  módulos do Node).

## 6. Comandos

| Comando | Para quê |
|---|---|
| `pnpm test` / `pnpm test:watch` | testes (Vitest) |
| `pnpm app` | gera preloads + tela e abre o app |
| `pnpm preloads` | depois de mudar `electron/*.src.js` ou `shared/` |
| `pnpm dist` | instalador + `.exe` portátil + conferência do `app.asar` |
| `pnpm release` | `pnpm dist` + `dist/release-vX.Y.Z` assinada para a release do GitHub (o Bruno publica; o app avisa quem tem o instalador) |
| `pnpm release-key` | uma vez só: cria a chave das atualizações (privada em `%USERPROFILE%\.laaazy`, nunca no projeto) |
| `pnpm icons` | ícones a partir de `docs/assets/logo.svg` |

## 7. Armadilhas conhecidas

- **Barra invertida em heredoc** do bash some ou vira caractere de controle: para código com
  `\`, use a ferramenta Write/Edit (ou Python com `chr(92)`).
- **Final de linha misto** (CRLF e LF convivem no repo): `sed -i` e Python em modo texto trocam o
  final de linha do arquivo inteiro e o diff vira centenas de linhas. Use Edit, ou Python em modo
  binário mantendo o `\r\n` que o arquivo já tinha; confira com `git diff --stat`.
- `electron/preload.js` e `stream-preload.js` são **gerados** (não editar; estão no .gitignore).
- Perfil **PC** do Laaazy-pad: X = clique esquerdo, O = clique direito, analógico = mouse.
  O Laaazy-pad é outro projeto (`../laaazy-pad`, contrato em `docs/CONTRATO.md` de lá): aqui só
  o adaptador `adapters/laaazy-pad-cli.js`. Nunca enviar Ctrl+Alt+Home para testar (é o PS).
  O Laaazy arbitra isso em `app/lib/input-mode` — não ler o mesmo botão duas vezes.
- O PS fecha o programa da frente com `taskkill /T`: nunca fechar ancestrais do Laaazy.
- Depois de abrir o app para diagnóstico, **soltar o cursor** (`[FG]::Unclip()`) e fechar o app.
- Imagens do README ficam em cache no GitHub: troque o **nome do arquivo** para atualizar.

## 8. Segurança, privacidade e git

- Chaves (TMDB, Gemini, YouTube, SteamGridDB) só **dentro do app**, criptografadas
  (`safeStorage`). Nunca pedir nem aceitar chave pelo chat; nunca em código, teste ou log.
- Testes **nunca** chamam APIs reais.
- Commits como `Bruno <brunodev09@gmail.com>`, pequenos, explicando o porquê.
- `git push` só quando o Bruno pedir. O branch local `backup-antes-autor` **nunca** vai para o GitHub.
- Software nunca está pronto: iterar em passos pequenos vale mais que um "prompt único".
