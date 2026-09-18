// Copies flag-icons' 4:3 SVGs and a matching stylesheet into public/flags so the
// flags load as plain static files. Importing the package CSS through the bundler
// makes Turbopack process 500+ url() assets on every apply-route compile, which
// widened the dev-server race documented in CLAUDE.md. Runs on postinstall.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'node_modules/flag-icons')
const out = resolve(root, 'public/flags')
mkdirSync(resolve(out, '4x3'), { recursive: true })
let n = 0
for (const f of readdirSync(resolve(src, 'flags/4x3'))) {
  if (!f.endsWith('.svg')) continue
  copyFileSync(resolve(src, 'flags/4x3', f), resolve(out, '4x3', f))
  n++
}
// Keep only the 4:3 rules; the 1:1 set is not used.
const css = readFileSync(resolve(src, 'css/flag-icons.min.css'), 'utf8')
  .replace(/url\(\.\.\/flags\/4x3\//g, 'url(/flags/4x3/')
  .replace(/\.fi-[a-z-]+\.fis\{[^}]*\}/g, '')
writeFileSync(resolve(out, 'flag-icons.css'), css)
console.log(`flags: ${n} files → public/flags`)
