export type Tokens = {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

export type Totals = {
  main: Tokens
  sub: Tokens
  usd: number
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
    }
  }
}
