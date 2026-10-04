// Contrato de window.lazy (definido em electron/preload.src.js).
export type Game = { id: string; name: string; platform: string; cover?: string }
export type Result = { ok: boolean; msg: string }
export type StreamMode = 'app' | 'edge'
export type Settings = {
  closeDs4OnMenu: boolean
  librarySort: 'asc' | 'desc'
  streamModes: Record<string, StreamMode>
}
export type Ds4Data = { profiles: string[]; config: Record<string, string>; dir: string | null; cmd: string }
export type DrmStatus = { installed: boolean; version: string; msg: string }

export type LazyApi = {
  open(url: string, label: string): Promise<string>
  launch(name: string): Promise<string>
  quit(): void
  onHome(cb: () => void): void
  settings: { get(): Promise<Settings>; set(key: string, value: unknown): Promise<boolean> }
  exe: { get(key: string): Promise<string>; choose(key: string): Promise<string> }
  edge: { get(): Promise<string>; choose(): Promise<string> }
  ds4: { get(): Promise<Ds4Data>; set(key: string, value: string): Promise<Result> }
  store: { warnings(): Promise<{ at: number; msg: string }[]> }
  games: {
    list(opts?: { fresh: boolean }): Promise<Game[]>
    launch(id: string): Promise<Result>
    addExe(): Promise<Result & { added: number }>
    addFolder(): Promise<Result & { added: number }>
    remove(id: string): Promise<Result>
  }
  system: { user(): Promise<{ name: string }> }
  drm: { status(): Promise<DrmStatus> }
}

// undefined fora do Electron (ex.: `pnpm dev` no navegador)
export const getLazy = (): LazyApi | undefined =>
  typeof window === 'undefined' ? undefined : (window as unknown as { lazy?: LazyApi }).lazy
