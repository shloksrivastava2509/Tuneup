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

// One turn's receipt, and the end of the answer it belongs under.
export type Receipt = { tail: string; line: string }

// How full the context window is, as Claude Code last measured it.
export type Context = { percent: number; window: number }

declare module 'claude-code' {
  interface PluginState {
    'token-info': {
      session: Totals
      project: Totals
      all: Totals
      tab: Tab
      // Whether the Token info box above the prompt is shown.
      isOpen: boolean
      // This session's latest receipts, newest last.
      receipts: Receipt[]
      context: Context | null
      // Whether the /compact reminder was shown since the context last dropped back.
      isReminded: boolean
    }
  }
}
