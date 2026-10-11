export type Tokens = {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

export type Totals = {
  main: Tokens
  sub: Tokens
  // API-equivalent cost of the tokens whose model has known rates.
  usd: number
  // Tokens from models with no known rates, which `usd` leaves out.
  unpriced: number
  turns: number
}

export type Tab = 'session' | 'project' | 'all'

declare module 'claude-code' {
  interface PluginState {
    'tuneup-dashboard': {
      session: Totals
      project: Totals
      all: Totals
      tab: Tab
      // Whether the box above the prompt is shown.
      isOpen: boolean
    }
  }
}
