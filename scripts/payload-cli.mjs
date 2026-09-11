// Runs Payload's CLI under tsx's synchronous loader hooks (Node ≥ 22.15).
// Payload's own bin.js forces tsx onto its async loader-worker path, which on
// this machine goes silent mid-run (generate:types / migrate:* exit 0 with no
// output). Usage: node --import tsx/esm scripts/payload-cli.mjs <command>
import 'dotenv/config'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const binPath = resolve(root, 'node_modules/payload/dist/bin/index.js')
if (!existsSync(binPath)) throw new Error(`Payload bin not found at ${binPath}`)
process.env.PAYLOAD_CONFIG_PATH ??= resolve(root, 'src/payload.config.ts')
const { bin } = await import(pathToFileURL(binPath).href)
await bin()
