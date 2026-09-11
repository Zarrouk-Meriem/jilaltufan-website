// Regenerates src/payload-types.ts by calling Payload's own generateTypes()
// directly, with its logger disabled. Payload's CLI wrapper hangs in this
// environment (see CLAUDE.md); the generator itself is fine.
//   pnpm generate:types
import 'dotenv/config'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const configPath = process.env.PAYLOAD_CONFIG_PATH ?? resolve(root, 'src/payload.config.ts')
const config = await (await import(pathToFileURL(configPath).href)).default
const { generateTypes } = await import(
  pathToFileURL(resolve(root, 'node_modules/payload/dist/bin/generateTypes.js')).href
)
await generateTypes(config, { log: false })
console.log(`Types written to ${config.typescript.outputFile}`)
process.exit(0)
