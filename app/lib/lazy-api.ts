// Contrato de window.lazy (definido em electron/preload.src.js).
export type Game = { id: string; name: string; platform: string; cover?: string }
export type Result = { ok: boolean; msg: string }
export type FsEntry = { name: string; path: string; type: 'dir' | 'exe' | 'lnk' | 'place' | 'drive' }
export type FsList = { ok: boolean; path?: string; parent?: string | null; entries: FsEntry[]; msg?: string }
export type StreamMode = 'app' | 'edge'
export type Settings = {
  closeDs4OnMenu: boolean
  psClosesApp?: boolean
  trailerPreview?: boolean
  trailerSound?: boolean
  lockCursor?: boolean
  librarySort: 'asc' | 'desc'
  streamModes: Record<string, StreamMode>
  pinnedApps?: string[]
  screensaverMinutes?: number
  geminiModel?: string
}
export type Ds4Data = { profiles: string[]; config: Record<string, string>; dir: string | null; cmd: string }
export type DrmStatus = { installed: boolean; version: string; msg: string }
export type Title = {
  id: string; kind: 'Série' | 'Filme'; title: string; year: string; overview: string
  poster: string; backdrop: string; popularity: number; services: string[]; anime?: boolean
}
export type CatalogHome = { ok: boolean; configured: boolean; stale?: boolean; series: Title[]; films: Title[]; animes?: Title[]; msg?: string }

export type PowerAction = 'quit' | 'suspend' | 'shutdown' | 'shutdown_3h' | 'shutdown_2h' | 'shutdown_cancel'

export type LazyApi = {
  open(url: string, label: string): Promise<string>
  launch(name: string): Promise<string>
  quit(): void
  clipboard: { read(): Promise<string> }
  // Área de trabalho: perfil PC no controle e Laaazy minimizado (o PS traz de volta)
  desktop(): Promise<{ ok: boolean; msg: string }>
  fs: { list(dir: string, mode: 'file' | 'dir'): Promise<FsList> }
  oskOverlay: { submit(text: string): Promise<boolean>; cancel(): Promise<void>; onOpened(cb: () => void): void }
  volume(action: 'up' | 'down' | 'mute'): void
  onHome(cb: () => void): void
  ps: { startTest(): Promise<boolean>; onTested(cb: () => void): void }
  settings: { get(): Promise<Settings>; set(key: string, value: unknown): Promise<boolean> }
  exe: { get(key: string): Promise<string>; choose(key: string): Promise<string> }
  ds4: { get(): Promise<Ds4Data>; set(key: string, value: string): Promise<Result> }
  store: { warnings(): Promise<{ at: number; msg: string }[]> }
  games: {
    list(opts?: { fresh: boolean }): Promise<Game[]>
    launch(id: string): Promise<Result>
    addExe(): Promise<Result & { added: number }>
    addFolder(): Promise<Result & { added: number }>
    remove(id: string): Promise<Result>
    addExePath(path: string): Promise<Result & { added: number }>
    addFolderPath(path: string): Promise<Result & { added: number }>
    recent(): Promise<Game[]>
  }
  ai: {
    status(): Promise<{ configured: boolean; model: string; left: number }>
    setKey(key: string): Promise<Result>
    clearKey(): Promise<Result>
    // "Parecido com este": clima do título (pela IA) e títulos com o mesmo clima
    similar(title: Title): Promise<{ ok: boolean; items: Title[]; mood?: string; ai?: boolean; msg?: string }>
  }
  // Trailers dublados/legendados pelo YouTube (chave opcional)
  yt: { status(): Promise<{ configured: boolean; left: number }>; setKey(key: string): Promise<Result>; clearKey(): Promise<Result> }
  covers: { status(): Promise<{ configured: boolean }>; setKey(key: string): Promise<Result>; clearKey(): Promise<Result> }
  power: {
    run(action: PowerAction, confirmed?: boolean): Promise<{ ok: boolean; confirm?: boolean; msg?: string }>
    openAtLogin(): Promise<boolean>
    setOpenAtLogin(on: boolean): Promise<void>
  }
  myList: { get(): Promise<Title[]>; toggle(item: Title): Promise<{ ok: boolean; added?: boolean; msg?: string }> }
  system: { user(): Promise<{ name: string }> }
  drm: { status(): Promise<DrmStatus> }
  catalog: {
    status(): Promise<{ configured: boolean }>
    setKey(key: string): Promise<Result>
    clearKey(): Promise<Result>
    home(opts?: { fresh: boolean }): Promise<CatalogHome>
    // Trailers do melhor ao pior; o player tenta o próximo se um não tocar
    trailer(id: string, hint?: { title: string; year: string }): Promise<{ key: string; lang: string; label?: 'dublado' | 'legendado' }[]>
    search(query: string): Promise<{ ok: boolean; configured?: boolean; items: Title[]; msg?: string }>
    where(id: string): Promise<string[]>
    episodes(): Promise<{ id: string; label: string; kind: 'new' | 'soon'; date: string }[]>
    explore(sel: { kind: string; genre: string; duration: string; sort: string }): Promise<{ ok: boolean; configured?: boolean; items: Title[]; msg?: string }>
  }
}

// undefined fora do Electron (ex.: `pnpm dev` no navegador)
export const getLazy = (): LazyApi | undefined =>
  typeof window === 'undefined' ? undefined : (window as unknown as { lazy?: LazyApi }).lazy
