export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

export const START = '<!-- tuneup:start -->'
export const END = '<!-- tuneup:end -->'

const isObject = (v: Json | undefined): v is { [key: string]: Json } =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const union = (base: Json[], patch: Json[]): Json[] => {
  const seen = new Set(base.map(item => JSON.stringify(item)))

  return [...base, ...patch.filter(item => !seen.has(JSON.stringify(item)))]
}

// Objects merge key by key, arrays are unioned, and no key of `base` is ever removed.
export const deepMerge = (base: Json, patch: Json): Json => {
  if (Array.isArray(base) && Array.isArray(patch)) {
    return union(base, patch)
  }
  if (isObject(base) && isObject(patch)) {
    const merged: { [key: string]: Json } = { ...base }
    for (const [key, value] of Object.entries(patch)) {
      const held = base[key]
      merged[key] = held === undefined ? value : deepMerge(held, value)
    }

    return merged
  }

  return patch
}

export const parseSettings = (text: string | null, path: string): Json => {
  if (text === null || text.trim() === '') {
    return {}
  }
  let parsed: Json
  try {
    parsed = JSON.parse(text) as Json
  } catch {
    throw new Error(`${path} is not valid JSON. Fix it first; tuneup will not rewrite a file it cannot read.`)
  }
  if (!isObject(parsed)) {
    throw new Error(`${path} does not hold a JSON object.`)
  }

  return parsed
}

// A file that already holds everything in `patch` comes back untouched, formatting included.
export const mergeSettings = (text: string | null, patch: Json, path: string): string => {
  const held = parseSettings(text, path)
  const merged = deepMerge(held, patch)
  if (text !== null && JSON.stringify(held) === JSON.stringify(merged)) {
    return text
  }

  return `${JSON.stringify(merged, null, 2)}\n`
}

// Writes `block` between the markers and leaves every other byte of the file as it was.
export const upsertBlock = (text: string | null, block: string): string => {
  const eol = text?.includes('\r\n') ? '\r\n' : '\n'
  const marked = [START, ...block.trim().split(/\r?\n/), END].join(eol)
  if (text === null || text === '') {
    return `${marked}${eol}`
  }
  const start = text.indexOf(START)
  const end = text.indexOf(END)
  if (start !== -1 && end > start) {
    return `${text.slice(0, start)}${marked}${text.slice(end + END.length)}`
  }
  if (start !== -1 || end !== -1) {
    throw new Error('CLAUDE.md has one tuneup marker without the other. Remove it or restore the pair.')
  }
  const gap = text.endsWith(eol + eol) ? '' : text.endsWith(eol) ? eol : eol + eol

  return `${text}${gap}${marked}${eol}`
}
