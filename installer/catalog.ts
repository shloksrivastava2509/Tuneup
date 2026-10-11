import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import type { Json } from './merge.js'

export type Install = { plugin: string } | { claudeMd: string } | { settings: Json }

export type Feature = {
  id: string
  minVersion: string
  profiles: string[]
  install: Install
  why: string
}

export type Profile = {
  id: string
  title: string
  features: string[]
  settings: { [key: string]: Json }
  mcp: string[]
}

const VERSION = /^\d+\.\d+\.\d+$/

export const compareVersions = (a: string, b: string): number => {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0) {
      return diff
    }
  }

  return 0
}

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'))

export const loadCatalog = (root: string): Feature[] => {
  const catalog = readJson(join(root, 'catalog', 'features.json')) as Feature[]
  for (const feature of catalog) {
    if (typeof feature.id !== 'string' || !VERSION.test(feature.minVersion ?? '')) {
      throw new Error(`catalog/features.json: entry "${feature.id}" needs an id and a minVersion like 2.1.287`)
    }
  }

  return catalog
}

export const loadProfiles = (root: string): Profile[] => {
  const dir = join(root, 'profiles')

  return readdirSync(dir)
    .filter(name => name.endsWith('.json'))
    .sort()
    .map(name => {
      const profile = readJson(join(dir, name)) as Profile
      if (`${profile.id}.json` !== name || !Array.isArray(profile.features)) {
        throw new Error(`profiles/${name}: needs an id matching its file name and a features list`)
      }

      return profile
    })
}

export type Resolved = { enabled: Feature[]; skipped: { feature: Feature; reason: string }[] }

export const resolveFeatures = (profile: Profile, catalog: Feature[], claudeVersion: string): Resolved => {
  const resolved: Resolved = { enabled: [], skipped: [] }
  for (const id of profile.features) {
    const feature = catalog.find(one => one.id === id)
    if (!feature) {
      throw new Error(`profile ${profile.id} lists "${id}", which is not in catalog/features.json`)
    }
    if (!feature.profiles.includes('*') && !feature.profiles.includes(profile.id)) {
      throw new Error(`catalog entry "${id}" is not offered to profile ${profile.id}`)
    }
    if (compareVersions(claudeVersion, feature.minVersion) < 0) {
      resolved.skipped.push({ feature, reason: `needs Claude Code ${feature.minVersion}, found ${claudeVersion}` })
    } else {
      resolved.enabled.push(feature)
    }
  }

  return resolved
}
