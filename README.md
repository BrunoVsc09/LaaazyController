<div align="center">

<img src="docs/assets/banner.svg" alt="Laaazy — seu PC com cara de console" width="100%">

<br>

![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011-0078D6?logo=windows&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-castlabs%2044%20(Widevine)-47848F?logo=electron&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Testes](https://img.shields.io/badge/testes-552%20passando-2ea44f?logo=vitest&logoColor=white)
![TDD](https://img.shields.io/badge/feito%20com-TDD-ffd23f)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)

**Uma central de mídia para Windows pensada para o sofá:** filmes, séries, animes, jogos e apps<br>
numa tela só, com cara de console e controlada inteira pelo **DualShock 4**.

[Recursos](#-recursos) · [Telas](#-telas) · [Controle](#-no-controle) · [Como rodar](#-como-rodar) · [Arquitetura](#-arquitetura) · [Qualidade](#-qualidade)

<sub>🇺🇸 <i>Laaazy is a couch-first media hub for Windows: movies, shows, anime, games and apps in one console-like screen, driven entirely by a PS4 controller. Built test-first (552 tests), hexagonal Electron core, Gemini-powered "more like this", dubbed trailers from YouTube.</i></sub>

</div>

<br>

<img src="docs/assets/screenshots/01-inicio.jpg" alt="Início do Laaazy com a prévia do trailer dublado tocando" width="100%">

## ✨ Recursos

<table>
<tr>
<td width="50%" valign="top">

### 🎬 Filmes, séries e animes
- Fileiras **sorteadas** do que está nos **seus** streamings (Netflix, Prime Video, HBO Max, Crunchyroll), via TMDB
- **Prévia do trailer** no destaque: 1 aperto mostra, 2 apertos abrem onde assistir
- **Trailer dublado ou legendado** procurado no YouTube, com selo 🇧🇷 na prévia
- **Novos episódios** das séries da sua lista e **Minha lista**

</td>
<td width="50%" valign="top">

### ✨ "Parecido com este" (IA)
- Aperte **△** num título: o **Gemini** descreve o *clima* dele e sugere outros com a mesma vibe
- Cada sugestão é **conferida no TMDB**: nada inventado aparece
- Sem IA? A fileira usa as recomendações do TMDB

</td>
</tr>
<tr>
<td valign="top">

### 🎮 Biblioteca de jogos
- Encontra jogos da **Steam**, **Epic** e pastas do PC
- Capas automáticas (Steam e SteamGridDB)
- **Perfil do controle por jogo** (△ na Biblioteca)
- Navegador de pastas **com o controle** para adicionar `.exe`
- O PS **fecha o jogo** e volta ao Início

</td>
<td valign="top">

### 🛋️ Feito para o sofá
- Teclado na tela — e **por cima do Edge** (Ctrl+Alt+K) para senhas e buscas
- **Explorar sem digitar**: tipo, categoria, duração e ordem em chips
- **Energia**: desligar daqui a 2 ou 3 horas, suspender, cancelar
- **Área de trabalho** com um botão: o controle vira mouse
- Proteção de tela, volume no L2/R2, mouse preso na tela

</td>
</tr>
</table>

## 🖼️ Telas

<table>
<tr>
<td width="50%"><img src="docs/assets/screenshots/02-parecidos.jpg" alt="Parecido com Bones: investigação forense leve com química de parceiros"><br><sub><b>△ Parecido com este</b> — o Gemini resume o clima ("investigação forense leve com química de parceiros") e o TMDB confere cada título.</sub></td>
<td width="50%"><img src="docs/assets/screenshots/03-biblioteca.jpg" alt="Biblioteca de jogos com capas e perfil do controle por jogo"><br><sub><b>Biblioteca</b> — Steam, Epic e PC juntos, com o perfil do DS4Windows de cada jogo.</sub></td>
</tr>
<tr>
<td><img src="docs/assets/screenshots/04-busca.jpg" alt="Explorar sem digitar"><br><sub><b>Explorar sem digitar</b> — categoria, duração e ordem só com o D-pad.</sub></td>
<td><img src="docs/assets/screenshots/05-energia.jpg" alt="Menu Energia com desligamento agendado"><br><sub><b>Energia</b> — desligamento agendado pelo próprio Windows, sempre com "Você tem certeza?".</sub></td>
</tr>
</table>

## 🎮 No controle

| Botão | No Laaazy |
|---|---|
| **D-pad / analógico** | Anda pela tela (navegação espacial) |
| **✕** | Confirma · no Início: 1× prévia, 2× assistir |
| **○** | Volta |
| **△** | Parecidos (Início) · perfil do controle do jogo (Biblioteca) |
| **□** | Busca |
| **L2 / R2** | Volume |
| **PS** | Fecha o jogo/app da frente e volta ao Início — de qualquer lugar |
| **Share** *(macro no DS4Windows)* | Teclado por cima do Edge |

Usando o mouse junto? Sem briga: o cursor some quando você usa o controle e a seleção só segue o mouse quando ele anda de verdade.

## 🚀 Como rodar

**Requisitos:** Windows 10/11 · [Node.js](https://nodejs.org) 20+ · [pnpm](https://pnpm.io) · Microsoft Edge · [DS4Windows](https://github.com/schmaldeo/DS4Windows) (opcional, para o PS e os perfis)

```bash
pnpm install
pnpm app        # gera a tela e abre o Laaazy
```

| Comando | O que faz |
|---|---|
| `pnpm test` | roda os 552 testes (Vitest) |
| `pnpm dev` | só a tela, no navegador |
| `pnpm dist` | gera o `.exe` portátil em `dist/` e confere o pacote |

### 🔑 Chaves (todas grátis e opcionais)

As chaves são coladas **dentro do app** (Configurações) e guardadas **criptografadas pelo Windows** (`safeStorage`) — nunca no código, no git ou em logs.

| Chave | Libera |
|---|---|
| [TMDB](https://www.themoviedb.org/settings/api) | Filmes, séries, animes, onde assistir |
| [Gemini](https://aistudio.google.com/apikey) | "Parecido com este" (△) |
| [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com) | Trailers dublados e legendados |
| [SteamGridDB](https://www.steamgriddb.com/profile/preferences/api) | Capas de jogos da Epic e do PC |

## 🏛️ Arquitetura

Electron com **arquitetura hexagonal**: as regras ficam num núcleo puro, sem disco, rede nem Electron — por isso dá para testar tudo sem abrir o app.

```mermaid
flowchart LR
  subgraph Tela["Tela · Next.js 16 estático + React 19"]
    UI[screens / components] --> L[lib · regras da tela]
  end
  UI -- "IPC validado<br/>(só app://local)" --> IPC[ipc/register]
  subgraph Electron
    IPC --> S[services<br/>orquestração]
    S --> C[core<br/>regras puras]
    S --> A[adapters<br/>disco · PowerShell · HTTP]
    W[window<br/>janela · teclado por cima] --- S
  end
  A --> TMDB[(TMDB)]
  A --> GEM[(Gemini)]
  A --> YT[(YouTube)]
  A --> DS4[[DS4Windows]]
  A --> WIN[[Windows]]
```

| Pasta | Papel |
|---|---|
| `electron/core/` | regras puras (catálogo, trailers, IA, foco, energia, segurança…) |
| `electron/services/` | orquestração com dependências injetadas — testada com *fakes* |
| `electron/adapters/` | o único lugar que toca disco, processos, PowerShell e APIs |
| `electron/ipc/` | cada canal valida os argumentos e a origem |
| `shared/` | o que a tela e o Electron dividem: canais, controle, streamings |
| `app/` | a tela: telas, componentes, hooks e `lib/` testada |

## ✅ Qualidade

- **TDD do começo ao fim** — cada recurso nasceu de um teste vermelho: **552 testes** em 64 arquivos
- **Nenhuma API real nos testes**: TMDB, Gemini, YouTube e Windows entram como *fakes*
- **Segurança**: chaves criptografadas, IPC só aceita a tela do app, CSP, janela trancada, permissões negadas
- **Pacote conferido**: `pnpm dist` verifica o `app.asar` (nada de testes, segredos ou `node_modules`)
- Plano e decisões em [`docs/REFATORACAO.md`](docs/REFATORACAO.md) · roteiro manual em [`docs/TESTE-MANUAL.md`](docs/TESTE-MANUAL.md) · novidades no [`CHANGELOG.md`](CHANGELOG.md)

## 🙏 Créditos

**TMDB** — Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB. Capas e imagens de filmes e séries pertencem aos seus donos.

DS4Windows · castlabs Electron (Widevine) · YouTube · Google Gemini · SteamGridDB.
O Laaazy não é afiliado à Sony, à Microsoft nem aos serviços de streaming citados.

## 📄 Licença

[MIT](LICENSE) © Bruno
