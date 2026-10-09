// Qual tela está aberta e a animação da Biblioteca. No Início a navegação é espacial
// (o foco anda para o elemento mais próximo), então não há "card selecionado" aqui.
export type Screen = 'home' | 'library' | 'apps' | 'ds4' | 'settings' | 'search' | 'welcome'
export type ScreenState = { screen: Screen; anim: 'none' | 'entering' | 'leaving' }
export type ScreenAction =
  | { type: 'open'; screen: Exclude<Screen, 'home'> }
  | { type: 'leave' }
  | { type: 'animDone' }
  | { type: 'goHome' }

export const initialScreen: ScreenState = { screen: 'home', anim: 'none' }

// Só a Biblioteca tem animação de entrada/saída
const animated = (s: Screen) => s === 'library'

export function screenReducer(state: ScreenState, action: ScreenAction): ScreenState {
  switch (action.type) {
    case 'open':
      return { screen: action.screen, anim: animated(action.screen) ? 'entering' : 'none' }
    case 'leave':
      if (state.screen === 'home') return state
      if (animated(state.screen)) return { ...state, anim: 'leaving' }
      return { screen: 'home', anim: 'none' }
    case 'animDone':
      if (state.anim === 'leaving') return { screen: 'home', anim: 'none' }
      return { ...state, anim: 'none' }
    case 'goHome':
      return { screen: 'home', anim: 'none' }
  }
}
