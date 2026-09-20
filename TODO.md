# TODO — open items

_Updated at the end of M7. Everything below is content or a decision; the code paths that consume each item are already built and hide gracefully until it exists._

Everything the site needs that we don't have yet. Placeholders are in place for all of it; nothing here blocks development.

Legend: **P1** blocks launch · **P2** needed before real content goes live · **P3** nice to have

---

## Brand assets

- [x] **SVG logo.** The designer's vector lockup arrived 2026-09-19 (`public/brand/logo.svg`; `logo-on-dark.svg` is the same paths with a white wordmark; `logo.png`/`logo-on-dark.png` are rasters for JSON-LD, mail clients, and the image-wedge probe).
- [ ] **P1 — English lockup.** Still with the designer (2026-09-19). Until it arrives, `/en` uses the mark + type-set «Jil Altufan Academy» in Poppins.
- [ ] **P2 — Confirm the mark.** `mark.svg` is the Prop 1 arrow, not the inverted triangle described in the brief (see `PLAN.md` §2.1). Confirm the arrow is the intended standalone mark, or supply the triangle as a second asset.
- [ ] **P3 — Mono / single-colour logo** for print and low-colour contexts (reference 03 shows a grey variant).

## Typography

- [x] **Arabic typeface: Noto Kufi Arabic** (decided 2026-09-19, free under the OFL, the closest free face to Janna LT's humanist Kufi). Janna LT itself is a commercial Monotype font (about $41 per style, webfont licence per monthly-pageview tier, recurring as traffic grows) and stays out unless the academy chooses to pay. Al Jazeera's typeface was compared too but is exclusive to Al Jazeera (Tarek Atrissi Design, 2013) and cannot be used. Swap = one `next/font` declaration in `src/styles/fonts.ts`.
- [ ] **P2 — Confirm weights needed** (the references use at least a light/regular for eyebrows and a heavy for display).

## Content the academy must supply

- [x] **About text** — intro, founding philosophy, vision, values, and the eight goals are seeded from «الورقة التأسيسية» (10 June 2026). Rewritten 2026-09-17 for visitors (the paper was internal): same facts, plainer and shorter Arabic; `src/seed/content.ts` is the source, `pnpm seed` re-applies it while the About page is not editor-owned.
- [ ] **P2 — Review the public wording.** Someone from the academy should read `/ar/about`, `/ar/programs` and the six program pages once; the tone is theirs to sign off.
- [ ] **P1 — Session titles and summaries.** Program definitions, target audience, the four competencies, duration, and admission/continuation/graduation criteria are seeded from the founding paper; open training is 8 lectures Oct → May, the four directed programs are 6 sessions Jan → Jun. Sessions themselves are still `[الحصة الأولى]`… placeholders. «سفراء القدس الشريف» was replaced by «المشاريع الاستراتيجية» (Sep 2026); its own projects are still to be listed.
- [ ] **P1 — Real session dates and Zoom links** for the 2026/2027 season. _32 placeholder sessions exist (8 open Oct→May, 4 × 6 directed Jan→Jun), with no Zoom URLs._
- [ ] **P1 — Instructors:** names, roles, short bios, photos. _Seeded as «[اسم المحاضر]», no photos, no invented biography. Sessions currently have no instructor attached — this is deliberate._
- [ ] **P2 — Structure follow-ups.** The three councils are seeded from «دليل المؤسسات». By decision (2026-09-16) the public page names only the President and the Executive Director; the strategic partners list is not published. Still needed: confirmation of the English spellings of those two names (transliterated by us).
- [ ] **P2 — مخيمات جيل الطوفان** — the camp's week programme, exact September dates, location, and photos. _Description seeded from the founding paper._ _The Camp page renders programme-by-day, details, and a lightbox gallery as soon as they are entered; all three sections hide until then._
- [ ] **P2 — المشاريع والمبادرات** — actual graduation projects and incubator picks for `/projects` (the page intro now describes the graduation-project rule and the incubator). Also the strategic projects list for `/programs/strategic-projects`.
- [ ] **P2 — منبر الطوفان** — at least three posts, or the home section stays hidden (by design).
- [ ] **P2 — Code of conduct** and the student FAQ for `/students`. _Editable in admin → Windows → Student window (seeded with the built-in copy; the conduct line is a marked placeholder)._
- [ ] **P2 — Instructor guidelines** for `/instructors`. _Editable in admin → Windows → Instructor window._
- [ ] **P2 — Privacy policy and terms.** The drafts list exactly what the application form collects (updated 2026-09-17 for the three-step form: gender, date of birth, nationality, residence, profession, affiliation, social links, CV); **the academy must review and approve the final text.**
- [ ] **P3 — Statistics.** The stats band is built but **toggled off**. Turn it on only when real numbers exist: figures + switch in Site settings → Statistics, then Home page → Statistics band.

## Photography

- [ ] **P1 — Hero image.** Jerusalem / Al-Aqsa, to be navy-duotoned as in reference 07. _Placeholder: navy gradient + keffiyeh texture, no stock faces._ Must be licensed or academy-owned. _Upload in admin → Home page → Background photo; the duotone is applied on render._
- [ ] **P2 — Instructor portraits**, shot or cropped consistently (reference 06 crops to a rectangle over a navy backdrop).
- [ ] **P3 — Camp gallery** images (these render untreated, not duotoned).

## Decisions still with the client

- [x] **English name: «Jil Altufan Academy»** (decided 2026-09-19; the spelling used on email and social media). Applied everywhere on `/en`, in emails, calendar files, JSON-LD, and the OG image. Derived names follow the same spelling: «Jil Altufan Camp», «Minbar Altufan».
- [x] **Domain: `jilaltufan.org`** is the official one (non-profit); `.com` is registered too and should 301 to `.org` at the DNS/CDN layer.
- [x] **Mail:** `admin@jilaltufan.org` is the official mailbox; `contact@jilaltufan.org` (alias) receives contact-form messages; `no-reply@jilaltufan.org` sends — needs the domain verified in Resend (SPF + DKIM) before launch.
- [x] **Mail for applications:** `applications@jilaltufan.org` exists in Zoho (created 2026-09-18). Application notifications go there and it is the Reply-To on every applicant confirmation; Site settings → Applications email is seeded with it and falls back to `contact@` if emptied.
- [x] **CV is optional** (confirmed 2026-09-19): PDF/Word ≤ 5 MB, never blocks an applicant.
- [ ] **P2 — Social links** (Instagram, X, YouTube, Telegram…) for the footer and JSON-LD `sameAs`. None have been supplied yet (checked 2026-09-19: not in the brief, the references, or any session). _Enter in admin → Site settings → Social links; WhatsApp number in the same tab. The footer's «تابعنا» row stays hidden until one exists._
- [ ] **P2 — Registration mode per program.** Default is `application` for all six. Confirm, or mark specific programs `open`.
- [ ] **P2 — Join-link policy.** Default is `window` (link appears 30 min before start). Alternatives: `always`, `email-only`. _Enforced in the query layer: the Zoom URL is not in the HTML outside the window._
- [ ] **P2 — Academy time zone.** Default `Asia/Hebron`, labelled «بتوقيت القدس». Confirm.
- [ ] **P3 — Icon set.** The site's icons are drawn in-house in the Icons8 «Stencil» language the academy picked on 2026-09-19 (sharp, two-tone: navy body, red accent, `src/components/icons/Icon.tsx`). Icons8's own SVGs are a paid format (their public endpoint answers `PAID_FORMAT`); if a licence is bought, the glyph paths can be swapped one for one without touching any page.
- [ ] **P3 — Red display type on navy** — brand does it (refs 07, 08), WCAG fails it. See `PLAN.md` §2.2 for the compromise; confirm or override.

## Infrastructure (at deploy time, not now)

- [ ] **P1 — File the Next.js image-optimizer bug upstream and drop our patch when it lands.** Found in M7 by the production e2e run, reproduced on 16.3.4 and 16.3.5, patched locally in `patches/next@16.3.5.patch`. Issue text:
  > **`/_next/image` hangs forever for a variant if the client disconnects while the cold variant is being generated (self-hosted, `next start`).** `fetchInternalImage` builds the internal request with `socket: _req.socket` (`server/image-optimizer.js`). If the visitor's socket closes while the static file is piped into the `MockedResponse`, `on-finished` reports the response finished (dead socket), `send` destroys the pipe, and neither `serveStatic`'s `finish` nor `MockedResponse.hasStreamed` ever settles. The `ResponseCache` batcher keeps that pending promise, so every later request for the same cache key waits on it until the process restarts. Reproducer: `scripts/image-wedge.cjs` (four Playwright contexts open pages and close them 20–120 ms later against a cold `.next/cache/images`; afterwards 3–4 of 10 logo variants never respond). Fix that works for us: race `handleRequest(...).then(() => hasStreamed)` against the socket's `close` event (plus a 30 s ceiling as belt-and-braces) and reject with an `ImageError`, so the batcher's `finally` clears the key.
- [ ] **P1 — `docker-compose.prod.yml`** for the VPS path (app + postgres + volume + backups) — written at deploy time once the host is chosen.
- [x] **Hosting decision (2026-09-12):** Vercel free tier now as a preview (`SITE_NOINDEX=1`), VPS + Docker at launch when the budget allows — DEPLOY.md Path 0 has the exact order (migrate from the laptop _before_ the first build).
- [x] **Neon Postgres + Cloudflare R2** exist and the preview is live at `jilaltufan-website.vercel.app` (first deploy 2026-09-13, from the GitHub integration).
- [ ] **P1 — Keep the online database migrated.** Every Vercel build since 2026-09-13 failed (six in a row on 2026-09-19) because the five migrations written since then were never applied to Neon; the build prerenders pages that read Site settings and died on `column site_settings.applications_email does not exist` (reproduced locally with `.env.vercel` on 2026-09-19). Rule: after any schema change, run `NODE_ENV=production DATABASE_URL=<neon> pnpm payload:tsx migrate` from this machine **before** pushing; the build itself never migrates. The migrate is a production-database action, so it is run by hand, not by the assistant.
- [x] **One Vercel project.** `jilaltufan-website-l3o4` was deleted in the dashboard (2026-09-20); `jilaltufan-website` owns `jilaltufan-website.vercel.app` and is the only project linked to the repo, so each push builds once.
- [x] **Email:** Zoho SMTP live (`no-reply@` sender, `contact@` reply-to); the same six values go on the host.
- [ ] **P2 — Cloudflare Turnstile keys** if spam becomes a problem. The integration is behind an env flag and inert without keys.
- [ ] **P2 — Backups** for Postgres and media.
- [ ] **P3 — Lighthouse performance 94 → ≥95 (mobile).** Everything else is 100. The gap is simulated bytes: Next's client runtime (≈150 kB gz, not ours) and the Arabic webfont. Noto Kufi Arabic is one variable woff2 (re-measure after the 2026-09-19 swap; it replaced four Plex weights). The honest lever if it is still short is a self-hosted subset (drop presentation forms FB50–FEFF) via `next/font/local`; needs `fonttools` once.

## Unexplained errors (dev only so far)

- [ ] **P3 — Intermittent `No intl context found` 500s from `next dev` (2026-09-16), not yet reproduced deterministically.** Seen once: 282 server-side `⨯ Error: No intl context found` lines and 500s on a dozen public routes, both locales, while `pnpm check`, a 4-worker Playwright run, and a screenshot script all hit the dev server at once, minutes after `Header.tsx` had been swapped to its HEAD version and back under hot reload. A clean `scripts/dev-restart.sh` cleared it (123/123 e2e green, zero occurrences), and repeating the file swap alone on a clean server did not bring it back. Working hypothesis: a stale Turbopack module graph (two copies of next-intl's context) after the swap, triggered under load — the same class of thing the wedge note in CLAUDE.md warns about. If it recurs, capture `.artifacts-dev.log` before restarting and try a production build (`NEXT_DIST_DIR=.next-prod pnpm build && pnpm start`) to rule the app code in or out.
