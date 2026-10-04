// Qual tela está aberta, qual card do menu está selecionado e a animação da Biblioteca.
export type Screen = 'home' | 'library' | 'ds4' | 'settings'
export type ScreenState = { screen: Screen; selected: number; anim: 'none' | 'entering' | 'leaving' }
export type ScreenAction =
  | { type: 'move'; dir: number; count: number }
  | { type: 'select'; index: number }
  | { type: 'open'; screen: Exclude<Screen, 'home'> }
  | { type: 'leave' }
  | { type: 'animDone' }
  | { type: 'goHome' }

export const initialScreen: ScreenState = { screen: 'home', selected: 0, anim: 'none' }

// Só a Biblioteca tem animação de entrada/saída
const animated = (s: Screen) => s === 'library'

export function screenReducer(state: ScreenState, action: ScreenAction): ScreenState {
  switch (action.type) {
    case 'move':
      if (state.screen !== 'home') return state
      return { ...state, selected: Math.min(action.count - 1, Math.max(0, state.selected + action.dir)) }
    case 'select':
      return { ...state, selected: action.index }
    case 'open':
      return { ...state, screen: action.screen, anim: animated(action.screen) ? 'entering' : 'none' }
    case 'leave':
      if (animated(state.screen)) return { ...state, anim: 'leaving' }
      return { ...state, screen: 'home', anim: 'none' }
    case 'animDone':
      if (state.anim === 'leaving') return { ...state, screen: 'home', anim: 'none' }
      return { ...state, anim: 'none' }
    case 'goHome':
      return { ...state, screen: 'home', anim: 'none' }
  }
}
