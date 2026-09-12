# TODO — open items

_Updated at the end of M7. Everything below is content or a decision; the code paths that consume each item are already built and hide gracefully until it exists._

Everything the site needs that we don't have yet. Placeholders are in place for all of it; nothing here blocks development.

Legend: **P1** blocks launch · **P2** needed before real content goes live · **P3** nice to have

---

## Brand assets

- [ ] **P1 — SVG logo files.** `_context/brand/logo-color.png` and `logo-on-dark.png` are raster exports. Request vector originals from the designer (Haythem Makhlouf). _Swap is a one-file change in `/public/brand/`._
- [ ] **P1 — English lockup.** Reference 03 shows `ACADEMY / FLOOD'S GENERATION` but no file was supplied. Until it arrives, `/en` uses the mark + type-set Poppins. Confirm this is acceptable, or send the file.
- [ ] **P2 — Confirm the mark.** `mark.svg` is the Prop 1 arrow, not the inverted triangle described in the brief (see `PLAN.md` §2.1). Confirm the arrow is the intended standalone mark, or supply the triangle as a second asset.
- [ ] **P3 — Mono / single-colour logo** for print and low-colour contexts (reference 03 shows a grey variant).

## Typography

- [ ] **P1 — Janna LT webfont licence.** Commercial font. Until licensed files land in `/public/fonts/janna/`, the site uses **IBM Plex Sans Arabic** as the stand-in. Swap = one `next/font/local` declaration in `src/styles/fonts.ts`.
- [ ] **P2 — Confirm weights needed** (the references use at least a light/regular for eyebrows and a heavy for display).

## Content the academy must supply

- [ ] **P1 — About text** beyond the mission: نبذة عن الأكاديمية, الرؤية, الأهداف.
- [ ] **P1 — Program content** for all six: التعريف, الأهداف, الفئة المستهدفة, المدة, and the eight session titles + summaries. _Seeded as `[نص مؤقت]` with `isPlaceholder: true`._
- [ ] **P1 — Real session dates and Zoom links** for the 2026/2027 season. _48 placeholder sessions exist, one per month Sep→Apr, with no Zoom URLs._
- [ ] **P1 — Instructors:** names, roles, short bios, photos. _Seeded as «[اسم المحاضر]», no photos, no invented biography. Sessions currently have no instructor attached — this is deliberate._
- [ ] **P1 — الهيكلة والمجالس والفرق** — council and team structure for `/about/structure`.
- [ ] **P2 — مخيمات جيل الطوفان** — the camp's week programme, dates, location, and photos. _The Camp page renders programme-by-day, details, and a lightbox gallery as soon as they are entered; all three sections hide until then._
- [ ] **P2 — المشاريع والمبادرات** — projects for `/projects`.
- [ ] **P2 — منبر الطوفان** — at least three posts, or the home section stays hidden (by design).
- [ ] **P2 — Code of conduct** and the student FAQ for `/students`.
- [ ] **P2 — Instructor guidelines** for `/instructors`.
- [ ] **P2 — Privacy policy and terms.** Drafts will describe exactly what the application form collects and why; **the academy must review and approve the final text.**
- [ ] **P3 — Statistics.** The stats band is built but **toggled off**. Turn it on only when real numbers exist.

## Photography

- [ ] **P1 — Hero image.** Jerusalem / Al-Aqsa, to be navy-duotoned as in reference 07. _Placeholder: navy gradient + keffiyeh texture, no stock faces._ Must be licensed or academy-owned.
- [ ] **P2 — Instructor portraits**, shot or cropped consistently (reference 06 crops to a rectangle over a navy backdrop).
- [ ] **P3 — Camp gallery** images (these render untreated, not duotoned).

## Decisions still with the client

- [ ] **P1 — Final English name usage.** _"Academy · Flood's Generation"_ per the brief vs _"Jeel Al-Toufan Academy"_. Currently both appear in different places; pick one for `/en`.
- [x] **Domain: `jilaltufan.org`** is the official one (non-profit); `.com` is registered too and should 301 to `.org` at the DNS/CDN layer.
- [x] **Mail:** `admin@jilaltufan.org` is the official mailbox; `contact@jilaltufan.org` (alias) receives application and contact notifications; `no-reply@jilaltufan.org` sends — needs the domain verified in Resend (SPF + DKIM) before launch.
- [ ] **P2 — Social links** (Instagram, X, YouTube, Telegram…) for the footer and JSON-LD `sameAs`.
- [ ] **P2 — Registration mode per program.** Default is `application` for all six. Confirm, or mark specific programs `open`.
- [ ] **P2 — Join-link policy.** Default is `window` (link appears 30 min before start). Alternatives: `always`, `email-only`. _Enforced in the query layer: the Zoom URL is not in the HTML outside the window._
- [ ] **P2 — Academy time zone.** Default `Asia/Hebron`, labelled «بتوقيت القدس». Confirm.
- [ ] **P3 — Red display type on navy** — brand does it (refs 07, 08), WCAG fails it. See `PLAN.md` §2.2 for the compromise; confirm or override.

## Infrastructure (at deploy time, not now)

- [ ] **P1 — File the Next.js image-optimizer bug upstream and drop our patch when it lands.** Found in M7 by the production e2e run, reproduced on 16.3.4 and 16.3.5, patched locally in `patches/next@16.3.5.patch`. Issue text:
  > **`/_next/image` hangs forever for a variant if the client disconnects while the cold variant is being generated (self-hosted, `next start`).** `fetchInternalImage` builds the internal request with `socket: _req.socket` (`server/image-optimizer.js`). If the visitor's socket closes while the static file is piped into the `MockedResponse`, `on-finished` reports the response finished (dead socket), `send` destroys the pipe, and neither `serveStatic`'s `finish` nor `MockedResponse.hasStreamed` ever settles. The `ResponseCache` batcher keeps that pending promise, so every later request for the same cache key waits on it until the process restarts. Reproducer: `scripts/image-wedge.cjs` (four Playwright contexts open pages and close them 20–120 ms later against a cold `.next/cache/images`; afterwards 3–4 of 10 logo variants never respond). Fix that works for us: race `handleRequest(...).then(() => hasStreamed)` against the socket's `close` event (plus a 30 s ceiling as belt-and-braces) and reject with an `ImageError`, so the batcher's `finally` clears the key.
- [ ] **P1 — `docker-compose.prod.yml`** for the VPS path (app + postgres + volume + backups) — written at deploy time once the host is chosen.
- [ ] **P1 — Hosting decision.** `PLAN.md` §2.5: a small VPS + Docker lands at ~$6–10/mo against the ≈$25 target; Vercel Pro is $20 before a database. Both paths documented in `DEPLOY.md`.
- [ ] **P1 — Production Postgres** (`DATABASE_URL`) and **S3-compatible bucket** (Cloudflare R2 fits the budget well).
- [ ] **P1 — Email provider** (Resend or SMTP) + verified sending domain.
- [ ] **P2 — Cloudflare Turnstile keys** if spam becomes a problem. The integration is behind an env flag and inert without keys.
- [ ] **P2 — Backups** for Postgres and media.
- [ ] **P3 — Lighthouse performance 94 → ≥95 (mobile).** Everything else is 100. The gap is simulated bytes: Next's client runtime (≈150 kB gz, not ours) and eight preloaded woff2 files (four IBM Plex Sans Arabic weights ≈ 34 kB each). The honest lever is a self-hosted subset of the Arabic font (drop presentation forms FB50–FEFF, keep 400/500/600/700) via `next/font/local` — halves font bytes with no visible change; needs `fonttools` once. Do it when Janna LT arrives, since that swap touches the same file (`src/styles/fonts.ts`).
