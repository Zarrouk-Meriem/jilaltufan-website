// Regenerates src/app/(payload)/admin/importMap.js by calling Payload's own
// generateImportMap() directly and awaiting it. The CLI wrapper (`payload
// generate:importmap`, even under tsx) exits before its write settles about
// half the time. Run with every env-conditional plugin switched on — the
// package script sets placeholder S3_* values — so no plugin component is missing.
//   pnpm generate:importmap
import 'dotenv/config'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const configPath = process.env.PAYLOAD_CONFIG_PATH ?? resolve(root, 'src/payload.config.ts')
const config = await (await import(pathToFileURL(configPath).href)).default
const { generateImportMap } = await import(
  pathToFileURL(resolve(root, 'node_modules/payload/dist/bin/generateImportMap/index.js')).href
)
await generateImportMap(config, { force: true, log: true })
process.exit(0)
