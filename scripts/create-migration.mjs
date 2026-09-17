// Creates a Payload migration by calling the database adapter's own createMigration()
// directly. Payload's CLI wrapper (`payload migrate:create`) hangs or exits silently
// under the tsx loader on this machine (see CLAUDE.md); the generator itself is fine.
//   pnpm migrate:create <name>        → node --import tsx/esm scripts/create-migration.mjs <name>
import 'dotenv/config'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const name = process.argv[2]
if (!name) {
  console.error('usage: pnpm migrate:create <name>')
  process.exit(1)
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const configPath = process.env.PAYLOAD_CONFIG_PATH ?? resolve(root, 'src/payload.config.ts')
const config = await (await import(pathToFileURL(configPath).href)).default
const { default: payload } = await import(
  pathToFileURL(resolve(root, 'node_modules/payload/dist/index.js')).href
)
process.env.PAYLOAD_MIGRATING = 'true'
await payload.init({ config, disableDBConnect: true, disableOnInit: true })
await payload.db.createMigration({ migrationName: name, payload, forceAcceptWarning: true })
process.exit(0)
