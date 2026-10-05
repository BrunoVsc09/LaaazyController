# Segurança

## Chaves de API

O Laaazy usa chaves opcionais (TMDB, Gemini, YouTube, SteamGridDB). Elas:

- são coladas pelo usuário **dentro do app** (Configurações);
- ficam **criptografadas pelo Windows** (`safeStorage`) em `%APPDATA%\Laaazy\secrets.json`;
- **nunca** vão para o código, para o git, para os logs ou para a tela depois de salvas;
- vão só no **cabeçalho** das requisições (nunca na URL).

## Proteções do app

- Canais internos (IPC) só atendem a tela do próprio app (`app://local`); sites de streaming só enviam comandos do controle.
- Política de conteúdo (CSP) nas páginas do app; a janela não navega para fora nem abre janelas.
- Câmera, microfone, localização e afins ficam negados.
- O `.exe` é conferido para não levar testes, segredos nem `node_modules`.

## Encontrou uma falha?

Não abra uma issue pública. Use **Security → Report a vulnerability** neste repositório (aviso privado ao mantenedor).
