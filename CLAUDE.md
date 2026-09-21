# CLAUDE.md — conventions for this repository

Website of **أكاديمية جيل الطوفان / Jil Altufan Academy**. Arabic-first, bilingual, editorial.
Read `PLAN.md` before changing architecture. Read `TODO.md` before inventing content.

## Ground rules

- **Never invent facts.** No instructor names, dates, statistics, testimonials, or quotes that aren't supplied. Use `[نص مؤقت]` / `[Placeholder]`, set `isPlaceholder: true`, and add the gap to `TODO.md`.
- **Arabic is the default locale**, not a translation of English. Write Arabic copy first.
- **The brief lives in `PROMPT.md`; the visual truth lives in `_context/brand/references/`.** Look at the references before designing anything new.
- **The admin import map must not depend on env.** `next dev` regenerates `src/app/(payload)/admin/importMap.js` from _its_ environment on every config change; the S3 storage plugin is enabled only when `S3_*` is set, so a map generated without it lacked `@payloadcms/storage-s3/client#S3ClientUploadHandler` — and wherever the plugin _is_ active (the first Vercel deploy) Payload rendered the entire admin blank, with no console error, only a server log line `PayloadComponent not found in importMap`. Fix: env-conditional plugin components are pinned through `admin.dependencies` in `payload.config.ts`, so the generated map is identical everywhere; `tests/unit/import-map.test.ts` pins the entries. `pnpm generate:importmap` calls Payload's generator directly (`scripts/generate-importmap.mjs`) because the CLI exits before its write settles about half the time. After adding a plugin or custom admin component: add it to `admin.dependencies` if it is env-conditional, run the script, commit the file.
- **`next` is patched (`patches/next@16.3.5.patch`) and the patch is load-bearing.** Upstream's image optimizer hangs a cold variant forever when the visitor drops the connection mid-generation (`fetchInternalImage` shares the real socket; `send` aborts the pipe without ending the mock; the batched promise never settles). The patch races the internal fetch against the socket closing, plus a 30 s ceiling as belt-and-braces. `NEXT_DIST_DIR=.next-prod pnpm wedge <baseURL>` reproduces it in ~40 s — point it at a production server built into that directory (`NEXT_DIST_DIR=.next-prod pnpm build && NEXT_DIST_DIR=.next-prod PORT=3002 pnpm start`); the dist dir must match so the script clears the right image cache; it works against `next dev` too, but restart dev afterwards (`scripts/dev-restart.sh`) because the abrupt tear-downs can leave Turbopack's module graph stale. `pnpm verify` runs it when `WEDGE_URL` is set. On every Next upgrade: re-apply the patch (`pnpm patch next@<v>`), run `pnpm wedge` against a production build, and check whether the version already contains upstream's fix, vercel/next.js#98168 (merged 2026-09-10, first in `16.4.0-canary.26`; the wedge passes on a version that has it, so the patch can be dropped — TODO.md has the steps).
- **`next dev` and `next start` share one `.next/` output directory by default.** Running a local production check (`pnpm build && pnpm start`) at the same time as `pnpm dev`, or wiping `.next` for a dev restart while a production server is still running against it, corrupts whichever one isn't currently (re)building — symptom: `Invariant: client reference manifest does not exist` / missing `pages/500.html` on nearly every route, or a mass of unrelated 500s in one process while the other looks fine. Fix: give the production check its own directory — `NEXT_DIST_DIR=.next-prod pnpm build` then `NEXT_DIST_DIR=.next-prod PORT=3002 pnpm start` (see `next.config.ts`'s `distDir`). Never `rm -rf .next`/`--clean` a dev restart while a production server built from the plain `.next` is still up.
- **CSP has no nonce, on purpose.** Public pages are ISR/SSG; a per-request nonce never matches the nonce baked into cached HTML (every inline script was blocked in production — Lighthouse caught it, dev never could because dev renders per request). Only reintroduce a nonce if every page becomes dynamic. Test security headers against `pnpm build && pnpm start`, not `pnpm dev`.

## Stack

Next 16 (App Router, RSC-first) · React 19 · Payload 3 (embedded, Postgres) · Tailwind v4 · next-intl 4 · zod 4 + react-hook-form · Playwright + Vitest · **pnpm** (via `corepack enable`).

TypeScript version in use: **5.9.3** — TS 7.0 compiles the project but `typescript-eslint` 8.x rejects it (tracked at typescript-eslint#10940). Revisit when that lands.

## Commands

```bash
pnpm dev          # Next + Payload (needs docker compose up -d)
pnpm check        # tsc --noEmit + eslint + prettier --check + vitest run  ← must pass before any commit
pnpm test:e2e     # Playwright
pnpm seed         # idempotent seed
pnpm payload      # Payload CLI (migrations, generate:types)
```

Payload CLI gotchas (learned the hard way):

- The CLI needs `PAYLOAD_CONFIG_PATH` or it **silently no-ops** — the scripts in `package.json` set it; don't call `payload` bare.
- If a `payload` command exits 0 **silently or halfway** (generate:types, migrate:*), Payload's bin has hit its tsx loader-worker hang. Use the fallback: `pnpm payload:tsx <command>` (runs the same CLI under tsx's sync hooks).
- `payload run <script>` awaits the module import, not a dangling promise — scripts must use **top-level `await`** and `import 'dotenv/config'`.
- **`pnpm migrate:create <name>`** calls the adapter's generator directly (`scripts/create-migration.mjs`); the CLI wrapper exits 0 without writing anything. drizzle-kit still **prompts on stdin** whenever a diff both deletes and creates an enum or a column ("created or renamed?"), and the same prompt blocks `next dev`'s schema push until it is answered — with no terminal, both just hang. Run the generator in a pseudo-terminal and feed carriage returns (the default answer, "create", is right when a field was replaced, not renamed): `yes $'\r' | script -q /dev/null pnpm migrate:create <name>`. Then apply the generated `up` SQL to the local database yourself (psql through `docker compose exec -T postgres`) and record the row in `payload_migrations` before restarting dev, so the push finds nothing ambiguous. Read the generated SQL: a text column that becomes an enum is emitted as `SET DATA TYPE … USING col::enum`, which fails on any existing row — drop and re-add it instead.

After changing any collection or global: **`pnpm generate:types`** (wraps Payload's generator directly — the CLI wrapper hangs here) and commit `src/payload-types.ts`.

## Restarting the dev server

Use `PORT=3001 scripts/dev-restart.sh [--clean]`. Never poll the server with requests while Turbopack is doing its first compile after a `.next` wipe — that corrupts its manifests and every route returns 500 with `SyntaxError: Unexpected non-whitespace character after JSON`. The script waits for the "Ready" line, then warms every public route **one at a time** — parallel first compiles race the same way (seen 2026-09-18: four Playwright workers, or the desktop Browser pane's tab reconnecting over HMR, right after a clean restart). Close any Browser pane tab before a clean restart, and never import a stylesheet with hundreds of `url()` assets through the bundler (flags are one static stylesheet with every SVG embedded, `public/flags/flag-icons.css`, built by `scripts/sync-flags.mjs` on postinstall from `country-flag-icons`).

**Restart clean before any Playwright run that follows a source edit.** After Fast Refresh has replaced server modules, a loaded dev server intermittently answers 500 with `Error: No intl context found` from `usePathname()` in the Header (the refreshed client module and the provider hold different context objects). Seen twice on 2026-09-15/16, 47 × 500 in one run; gone every time after `scripts/dev-restart.sh --clean`. Production builds are unaffected. Also never run two Playwright suites against the dev server at once.

## Layout rules — non-negotiable

- **Logical properties only.** `ms-*` `me-*` `ps-*` `pe-*` `start-*` `end-*` `text-start` `border-s` `rounded-s-*`.
  Never `ml-*` `mr-*` `pl-*` `pr-*` `left-*` `right-*` `text-left` `text-right`. ESLint enforces this.
- Directional icons (arrows, chevrons) mirror in RTL. Logos, the mark, media controls, and digits do **not**.
- **Never apply `letter-spacing` or `text-transform` to Arabic** — it breaks letter joining. Tracked uppercase is for Latin eyebrow labels only.
- Western digits (0–9) in both locales: `numberingSystem: 'latn'`.

## Styling

- The font stack is `'Poppins', var(--font-arabic)` **by bare name on purpose** — `var(--font-latin)` would drag in next/font's Arial-aliased fallback, which has Arabic glyphs and hijacks Arabic text. Don't "fix" it.
- Colours, spacing, and type come from tokens in `src/styles/tokens.css`. **No hard-coded hex, ever** — if a value isn't a token, either add a token or you're doing it wrong.
- Red (`--red-600`) is ~5–10% of any screen: the mark, primary CTAs, rules, active states. Nothing else. **Errors never use it**: field errors are `--error-700` text and `--error-600` borders (a deeper brick), so a mistake is not painted in the identity colour (user feedback, 2026-09-18).
- On navy: text is white or `rgb(255 255 255 / .78)`. **Red is decorative on navy** (mark and rules only) — it fails text contrast.
- **The mark is never a small UI indicator** (nav, bullets, badges) — user feedback. It appears as logo, hero/timeline station, and card corner notch only. State is shown with weight, colour, or a hairline.
- **No utility row above the header** (user feedback). The header is one row: logo · five nav items · language switch · CTA. Student/Instructor windows live in the footer, the mobile menu, and contextual links.
- **Texture is the mark cascade** (`pattern-marks-navy` / `pattern-marks-paper`, `src/styles/patterns.css`): the designer's arrow mark on a staggered lattice, outlined, faint. The keffiyeh net stays defined but unused. The gradient cascade (`public/brand/patterns/cascade.svg`) is art, not texture: one placement per surface at most, never behind text.
- **The English lockup is outlined type** (`public/brand/logo-en*.svg`, Inter Black + JetBrains Mono SemiBold, both OFL). Never re-export it from a file with live `<text>`; regenerate with the outlining step if the designer sends a new one.
- Buttons and badges: 2px radius. The brand is angular; no pills.
- Section rhythm: 128px desktop / 72px mobile. Content max-width 1200px; reading pages narrower.

## Form controls — non-negotiable (user feedback, 2026-09-18)

- **Never a native `<select>` or a native date/time picker.** The OS draws them in its own style and they break the page. Use the site's controls: `Combobox` (`src/components/ui/Combobox.tsx`, searchable for long lists, `bare` inside composite fields), `DateField` (day · month · year comboboxes), `PhoneField` (country code combobox + number). Radios and checkboxes are drawn by us too (`RadioGroup`, `Checkbox` in `Field.tsx`). The only native widget left is the file picker, styled through `file:` utilities.
- Any new choice control must match the theme (2 px radius, hairline border, paper background, ink text, red only for the chosen mark) and follow the Motion rules below.

## Motion — non-negotiable (user feedback, 2026-09-18)

- **Nothing appears, disappears, or changes abruptly.** Anything that shows, hides, toggles, expands, swaps, or moves in response to the visitor (a conditional field, a step panel, an error line, a dropdown, a confirmation, a filter result) eases: opacity plus a 4–8 px lift, or height through `grid-template-rows`, 150–250 ms on `--ease-out`. Use the utilities in `globals.css`: `enter` (fade-up on show), `enter-fade` (fade only, for text inside a reserved slot), `collapse-y` (height 0fr/1fr, keep the child mounted and `inert` while collapsed). The Accordion is the model for height; `.reveal` for first view.
- **No layout jumps.** Reserve the space (every field has a message line, `FieldWrap`) or animate the height; never let content below hop when something above toggles.
- `prefers-reduced-motion` keeps the fade and drops the movement; it never shortens a duration to hide the problem.
- Instant is only acceptable for state that must not lag: focus rings and the live badge.

## Static rendering — the two traps (found 2026-09-20)

- **`loading.tsx` must not read the request.** It receives no `params`, so it cannot call `setRequestLocale`; a server-side `getTranslations()` there makes next-intl read the locale from the request and Next then renders the whole segment on demand (`ƒ` in the build table, `Cache-Control: no-store`, 200 ms TTFB instead of 5). `RouteLoading` is a client leaf with `useTranslations` for that reason. After touching a loader or a layout, read the build table: public pages must not show `ƒ` unless they read `searchParams` or export `force-dynamic`.
- **The loader's fallback is part of the prerendered HTML.** Next writes the Suspense fallback before the page content even for a static route, and swaps the content in as the document streams. The fallback is therefore at least viewport-tall (`min-h-dvh`), so the footer is never on screen when the swap lands — with a 60 dvh fallback it was, and every third Lighthouse run recorded a 0.30 layout shift.
- **Anything that renders only after hydration reserves its space** (Motion rules): `LocalTime` keeps a one-line slot on the server and fades the text in.
- **Fonts are measured, not assumed.** The Arabic face is a self-hosted subset (`scripts/subset-arabic-font.sh`); keep a–z in any subset or next/font emits `size-adjust: 100%` for the fallback and paragraphs grow when the font lands. Re-measure with the recipe in DEPLOY.md after any change to fonts, loaders, or the locale layout.

## Code conventions

- Server Components by default. `'use client'` only where interaction genuinely requires it — and then at the smallest possible leaf.
- **Pages never import `payload` directly.** All reads go through `src/lib/queries/*`, which enforces locale, `status: 'published'`, and the Zoom join-window gate.
- **No UI string is hard-coded.** Everything lives in `messages/ar.json` + `messages/en.json`, same key order in both.
- Public form writes: server action → zod (schema shared with the client) → honeypot → rate limit → Payload Local API with `overrideAccess: true`. Public `create` access stays `false` so the REST endpoint isn't an open door.
- `zoomPasscode` is field-level staff-read-only and must never reach a public query. `zoomJoinUrl` is omitted from the payload entirely outside the join window — gated in the query layer, not in JSX.
- Times stored UTC. Display via `src/lib/time/*` only. Academy zone comes from SiteSettings (`Asia/Hebron` default), never hard-coded.

## Accessibility

WCAG 2.2 AA is a gate, not a goal. Semantic landmarks, skip link, 2px red focus ring with offset on buttons and links (form fields instead darken their border to ink and take the soft `--focus-halo`; the hard ring on a field was called harsh, user feedback 2026-09-18), keyboard-complete accordion / menu / lightbox, form errors announced, `alt` required on every upload. Zero serious/critical axe violations.

Honour `prefers-reduced-motion` by removing transforms — not by shortening them.

## Adding a locale

`src/i18n/routing.ts` + `payload.config.ts` locales + `messages/xx.json`. If it needs more than that, the abstraction has leaked — fix the abstraction.

## Errors are never "environmental" until proven

If a console error, overlay, or warning shows up — in the user's browser or ours — it is not dismissed until it is **reproduced deterministically and pinned by a test**. `tests/e2e/hydration.spec.ts` is the model: a clean-browser guard on every route, a simulation of the offending condition, and a proof that real failures still surface. "It's an extension" is a hypothesis, not a verdict.

## Milestone checklist

1. `pnpm verify` green — it runs everything below in order; nothing is reported as done before it passes
2. `pnpm check` clean
3. `pnpm test:e2e` green — including `console.spec.ts` (zero console errors **or warnings** on every route, both locales, and after client-side navigation) and `hydration.spec.ts`
4. `node scripts/sim-extension.cjs` (Bitdefender's DOM stamping, simulated) and `node scripts/real-extensions.cjs` (the user's real Chrome extensions loaded from the local profile) — both must keep the dev overlay closed
5. Playwright screenshots of every touched page, **both locales**, at 375 / 768 / 1280 / 1440 → `.artifacts/screens/<milestone>/`
6. Compare honestly against `_context/brand/references/`; fix what's off; say what's still off
7. Commit with a clear message
8. Short summary to the user

Never report a milestone complete with a failing check. If something is blocked, finish everything else and say exactly what was left and why.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
