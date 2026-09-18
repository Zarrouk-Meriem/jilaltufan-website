// Builds public/flags/flag-icons.css: every flag embedded as a data URI, so the whole
// set arrives in one cached request and flags never pop in row by row. Source:
// country-flag-icons (the small, optimised 3:2 SVGs the phone-input libraries use).
// Importing flag CSS through the bundler is avoided on purpose (CLAUDE.md). Runs on
// postinstall; the output is git-ignored.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'node_modules/country-flag-icons/3x2')
const out = resolve(root, 'public/flags')
mkdirSync(out, { recursive: true })

// Minimal, URL-safe encoding for an SVG data URI (smaller than base64).
const encode = (svg) =>
  svg
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .replace(/[<>#%{}]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)

const rules = [
  '.fi{display:inline-block;width:1.5em;line-height:1em;background-size:contain;background-position:50%;background-repeat:no-repeat;position:relative}',
  '.fi::before{content:"\\00a0"}',
]
let n = 0
for (const f of readdirSync(src)) {
  const m = /^([A-Z]{2})\.svg$/.exec(f)
  if (!m) continue
  const svg = readFileSync(resolve(src, f), 'utf8')
  rules.push(`.fi-${m[1].toLowerCase()}{background-image:url("data:image/svg+xml,${encode(svg)}")}`)
  n++
}
writeFileSync(resolve(out, 'flag-icons.css'), rules.join('\n') + '\n')
console.log(`flags: ${n} embedded → public/flags/flag-icons.css`)
