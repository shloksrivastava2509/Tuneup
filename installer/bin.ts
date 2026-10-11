#!/usr/bin/env node
import { createInterface } from 'node:readline/promises'

import { runClaude } from './claude.js'
import { main } from './cli.js'

const ask = async (question: string): Promise<string> => {
  const prompt = createInterface({ input: process.stdin, output: process.stdout })
  try {
    return await prompt.question(question)
  } finally {
    prompt.close()
  }
}

process.exitCode = await main(process.argv.slice(2), {
  cwd: process.cwd(),
  env: process.env,
  run: runClaude,
  out: line => console.log(line),
  ask: process.stdin.isTTY ? ask : null,
  now: () => new Date(),
})
