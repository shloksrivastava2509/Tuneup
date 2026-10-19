import type { Plan } from './plan.js'

const lines = (text: string | null): string[] => (text === null || text === '' ? [] : text.replace(/\r?\n$/, '').split(/\r?\n/))

// A line diff by longest common subsequence: config files are small.
export const diffLines = (before: string | null, after: string): string[] => {
  const a = lines(before)
  const b = lines(after)
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i]![j] = a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!)
    }
  }
  const out: string[] = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      out.push(`  ${a[i]}`)
      i++
      j++
    } else if (i < a.length && (j === b.length || lcs[i + 1]![j]! >= lcs[i]![j + 1]!)) {
      out.push(`- ${a[i]}`)
      i++
    } else {
      out.push(`+ ${b[j]}`)
      j++
    }
  }

  return out
}

export const renderPreview = (plan: Plan): string => {
  const out: string[] = []
  for (const change of plan.changes) {
    out.push(`${change.before === null ? 'create' : 'change'} ${change.path}`, ...diffLines(change.before, change.after), '')
  }
  if (plan.changes.length === 0) {
    out.push(plan.plugins.length > 0 ? 'No file changes.' : 'No file changes: this project already matches the profile.', '')
  }
  for (const plugin of plan.plugins) {
    out.push(`install plugin ${plugin} (project scope)`)
  }
  // Roughly four characters to a token.
  out.push(`Always-loaded context added: about ${Math.ceil(plan.alwaysLoadedChars / 4)} tokens per request.`)
  out.push(...plan.notes)

  return out.join('\n')
}
