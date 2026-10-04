# Lazy PS4

Central de mídia para Windows com cara de PS4, controlada pelo DualShock 4:
streaming (Netflix, Prime, HBO Max, Crunchyroll, YouTube, Spotify), biblioteca de
jogos (Steam, Epic e jogos adicionados à mão) e troca automática de perfil do DS4Windows.

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm install` | instala as dependências |
| `pnpm test` | roda os testes (vitest) |
| `pnpm app` | gera os preloads, gera a tela e abre o app |
| `pnpm dist` | gera o `.exe` portátil em `dist/` (com assinatura VMP, ver abaixo) |
| `pnpm dev` | só a tela, no navegador (sem Electron: botões de programas não funcionam) |

Depois de mudar `electron/*.src.js` ou `shared/`, rode `pnpm preloads` (o `app` e o `dist` já rodam).

## Arquitetura

```
electron/main.js     raiz de composição: liga adapters → services → ipc → janela
electron/core/       regras puras (sem disco, processos ou Electron) — 100% testadas
electron/services/   orquestração; recebe dependências por parâmetro (testes usam fakes)
electron/adapters/   disco, processos, registro, PowerShell, DS4WindowsCmd, diálogos
electron/window/     janela, camada de streaming, protocolo app://
electron/ipc/        canal IPC → serviço, com validação dos argumentos
electron/*.src.js    fontes dos preloads (gerados por scripts/build-preloads.js)
shared/              usado pelo Electron e pela tela: canais, catálogo de streaming, perfis DS4, controle
app/                 tela (Next.js estático): page.tsx, screens/, components/, hooks/, lib/
```

Regra: `core/` não importa `fs`, `child_process` nem `electron`. Só `adapters/`,
`window/` e `main.js` tocam o sistema.

Plano e decisões: [docs/REFATORACAO.md](docs/REFATORACAO.md).
O que testar à mão: [docs/TESTE-MANUAL.md](docs/TESTE-MANUAL.md).

## Botão PS

No DS4Windows, mapeie o botão PS para **F24** (volta ao menu) e outro botão para
**F23** (fecha o programa da frente e volta). No teclado: Ctrl+Alt+Home e Ctrl+Alt+End.

## DRM (Netflix e outros) no `.exe`

O `pnpm dist` assina o app com VMP (castlabs EVS) no passo `afterPack`. Uma vez, na
máquina que gera o build:

```
pip install --upgrade castlabs-evs
python -m castlabs_evs.account signup
```

Sem isso o build sai, mas avisa que não foi assinado; aí vídeos com DRM podem não
tocar dentro do app. Alternativa: em Configurações, mude o serviço para "No Edge".
