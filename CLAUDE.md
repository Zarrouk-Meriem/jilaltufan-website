# CLAUDE.md — conventions for this repository

Website of **أكاديمية جيل الطوفان / Jeel Al-Toufan Academy**. Arabic-first, bilingual, editorial.
Read `PLAN.md` before changing architecture. Read `TODO.md` before inventing content.

## Ground rules

- **Never invent facts.** No instructor names, dates, statistics, testimonials, or quotes that aren't supplied. Use `[نص مؤقت]` / `[Placeholder]`, set `isPlaceholder: true`, and add the gap to `TODO.md`.
- **Arabic is the default locale**, not a translation of English. Write Arabic copy first.
- **The brief lives in `PROMPT.md`; the visual truth lives in `_context/brand/references/`.** Look at the references before designing anything new.

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
- `payload run <script>` awaits the module import, not a dangling promise — scripts must use **top-level `await`** and `import 'dotenv/config'`.

After changing any collection or global: **`pnpm payload generate:types`** and commit `src/payload-types.ts`.

## Layout rules — non-negotiable

- **Logical properties only.** `ms-*` `me-*` `ps-*` `pe-*` `start-*` `end-*` `text-start` `border-s` `rounded-s-*`.
  Never `ml-*` `mr-*` `pl-*` `pr-*` `left-*` `right-*` `text-left` `text-right`. ESLint enforces this.
- Directional icons (arrows, chevrons) mirror in RTL. Logos, the mark, media controls, and digits do **not**.
- **Never apply `letter-spacing` or `text-transform` to Arabic** — it breaks letter joining. Tracked uppercase is for Latin eyebrow labels only.
- Western digits (0–9) in both locales: `numberingSystem: 'latn'`.

## Styling

- The font stack is `'Poppins', var(--font-arabic)` **by bare name on purpose** — `var(--font-latin)` would drag in next/font's Arial-aliased fallback, which has Arabic glyphs and hijacks Arabic text. Don't "fix" it.
- Colours, spacing, and type come from tokens in `src/styles/tokens.css`. **No hard-coded hex, ever** — if a value isn't a token, either add a token or you're doing it wrong.
- Red (`--red-600`) is ~5–10% of any screen: the mark, primary CTAs, rules, active states. Nothing else.
- On navy: text is white or `rgb(255 255 255 / .78)`. **Red is decorative on navy** (mark and rules only) — it fails text contrast.
- **The mark is never a small UI indicator** (nav, bullets, badges) — user feedback. It appears as logo, hero/timeline station, and card corner notch only. State is shown with weight, colour, or a hairline.
- Buttons and badges: 2px radius. The brand is angular; no pills.
- Section rhythm: 128px desktop / 72px mobile. Content max-width 1200px; reading pages narrower.

## Code conventions

- Server Components by default. `'use client'` only where interaction genuinely requires it — and then at the smallest possible leaf.
- **Pages never import `payload` directly.** All reads go through `src/lib/queries/*`, which enforces locale, `status: 'published'`, and the Zoom join-window gate.
- **No UI string is hard-coded.** Everything lives in `messages/ar.json` + `messages/en.json`, same key order in both.
- Public form writes: server action → zod (schema shared with the client) → honeypot → rate limit → Payload Local API with `overrideAccess: true`. Public `create` access stays `false` so the REST endpoint isn't an open door.
- `zoomPasscode` is field-level staff-read-only and must never reach a public query. `zoomJoinUrl` is omitted from the payload entirely outside the join window — gated in the query layer, not in JSX.
- Times stored UTC. Display via `src/lib/time/*` only. Academy zone comes from SiteSettings (`Asia/Hebron` default), never hard-coded.

## Accessibility

WCAG 2.2 AA is a gate, not a goal. Semantic landmarks, skip link, 2px red focus ring with offset, keyboard-complete accordion / menu / lightbox, form errors announced, `alt` required on every upload. Zero serious/critical axe violations.

Honour `prefers-reduced-motion` by removing transforms — not by shortening them.

## Adding a locale

`src/i18n/routing.ts` + `payload.config.ts` locales + `messages/xx.json`. If it needs more than that, the abstraction has leaked — fix the abstraction.

## Milestone checklist

1. `pnpm check` clean
2. Playwright screenshots of every touched page, **both locales**, at 375 / 768 / 1280 / 1440 → `.artifacts/screens/<milestone>/`
3. Compare honestly against `_context/brand/references/`; fix what's off; say what's still off
4. Commit with a clear message
5. Short summary to the user

Never report a milestone complete with a failing check. If something is blocked, finish everything else and say exactly what was left and why.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
