# Contribuindo com o Laaazy

Valeu por querer ajudar! O Laaazy é feito **test-first**, e é isso que mantém ele estável.

## O jeito Laaazy de mudar código

1. **Vermelho** — escreva o teste que descreve o comportamento novo (ou o bug) e veja falhar.
2. **Verde** — escreva o mínimo de código para passar.
3. **Refatorar** — deixe limpo, com os testes verdes.

```bash
pnpm install
pnpm test:watch   # testes rodando enquanto você edita
pnpm app          # abre o app de verdade
```

## Onde cada coisa mora

- Regra nova (cálculo, decisão, validação)? → `electron/core/` (puro: sem `fs`, `child_process` nem `electron`).
- Algo que combina regras com o mundo? → `electron/services/`, recebendo as dependências por parâmetro.
- Disco, processos, PowerShell, HTTP? → `electron/adapters/` (fino, sem regra).
- Canal novo entre tela e Electron? → `shared/channels.js` + `electron/ipc/register.js` (valide os argumentos).
- Lógica da tela? → `app/lib/` (testável) e os componentes só ligam as peças.

## Regras de ouro

- **Nunca** coloque chave de API, senha ou token no código, nos testes ou nos logs.
- Testes **não** chamam APIs reais (TMDB, Gemini, YouTube…): use *fakes*.
- Comentários e textos da interface em português do Brasil.

## Antes do pull request

- `pnpm test` passando
- `pnpm build` sem erros
- Uma linha no [CHANGELOG.md](CHANGELOG.md) em "Próxima versão"
