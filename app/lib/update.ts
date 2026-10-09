// Textos do aviso de versão nova (o portátil não se instala sozinho: abre a página da versão)
export function updateCopy({ version, canInstall }: { version: string; canInstall: boolean }) {
  return {
    title: `Nova versão ${version}`,
    body: canInstall
      ? 'O Laaazy baixa a atualização, confere e instala sozinho. Ele fecha e abre de novo já atualizado.'
      : 'Esta é a versão portátil: baixe a nova na página do GitHub.',
    action: canInstall ? 'Atualizar agora' : 'Abrir no GitHub',
  }
}
