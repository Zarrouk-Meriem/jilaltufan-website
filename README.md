# أكاديمية جيل الطوفان — Jeel Al-Toufan Academy

The academy's website and content platform. Arabic-first, bilingual (ar / en), built with Next.js 16, Payload CMS 3, and Postgres.

## Local setup (≈ 5 minutes)

Requirements: Node 22+, Docker Desktop, pnpm 10 (`corepack enable` gives you pnpm; if `pnpm -v` fails, `corepack prepare pnpm@10.34.5 --activate`).

```bash
cp .env.example .env            # then set PAYLOAD_SECRET to any long random string
docker compose up -d            # Postgres 17 on :5432
pnpm install
pnpm dev                        # http://localhost:3000  (PORT=3001 pnpm dev if 3000 is taken)
pnpm seed                       # six programs, 48 placeholder sessions, the camp, the about page
```

Then open `/admin`, create the first account (it becomes an admin), and browse `/ar` or `/en`.

## Everyday commands

| Command                                       | What it does                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                    | Next + Payload with hot reload                                                                                                                    |
| `pnpm verify`                                 | **The gate.** `check` → full e2e (axe, console, hydration, overlay) → simulated + real browser extensions. Nothing is "done" until this is green. |
| `pnpm check`                                  | `tsc` + ESLint + Prettier + Vitest                                                                                                                |
| `pnpm test:e2e`                               | Playwright suite (needs the dev server; set `PORT` if not 3000)                                                                                   |
| `pnpm wedge <baseURL>`                        | Reproduces the Next image-optimizer hang we patch (`patches/`) — best against a production server; `verify` runs it when `WEDGE_URL` is set       |
| `pnpm screens`                                | Review screenshots of every route, both locales, 4 widths → `.artifacts/screens/`                                                                 |
| `pnpm seed`                                   | Idempotent seed (safe to re-run; never overwrites editor-owned records)                                                                           |
| `pnpm generate:types`                         | Regenerate `src/payload-types.ts` after changing a collection or global                                                                           |
| `pnpm migrate:create <name>` / `pnpm migrate` | Postgres migrations (use `pnpm payload:tsx migrate:…` if the CLI goes silent — see CLAUDE.md)                                                     |
| `pnpm build && pnpm start`                    | Production build and server                                                                                                                       |

## Where things live

```
src/app/(frontend)/[locale]/   public pages (ar default, en)
src/app/(payload)/             Payload admin at /admin and REST at /api
src/collections, src/globals   the content model (Arabic labels throughout)
src/lib/queries/               the only place pages read data — locale, published filter, Zoom join-window gate
src/lib/time/                  Al-Quds time, visitor time, session states (frozen-clock tests)
src/lib/forms/                 shared zod schemas, rate limiting, honeypot
src/components/                ui · layout · sections · forms · content · brand
messages/ar.json, en.json      every UI string, same keys in both
tests/unit, tests/e2e          Vitest · Playwright
scripts/                       verify.sh, dev-restart.sh, real-extensions.cjs, sim-extension.cjs
```

Conventions future work must follow are in `CLAUDE.md`. Open content and decisions are in `TODO.md`. The original plan is `PLAN.md`.

## Editors

Everything public is edited at `/admin` in Arabic: programs and their eight sessions (with Zoom links, shown to visitors only inside the join window), events and the camp, Minbar posts, materials, applications (with CSV export), and site settings (contact email, time zone, join-link policy). Only records with status **منشور / Published** are visible on the site.
