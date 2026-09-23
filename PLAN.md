# PLAN.md — أكاديمية جيل الطوفان / Jil Altufan Academy

**Status:** M0 — awaiting approval. No application code written yet.
**Date:** 2026-09-11 · **Season referenced by seed data:** 2026/2027 (Sep 2026 → Apr 2027)

---

## 1. What I read

| Source                                                   | What I took from it                                                                                                                                                                                                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_context/docs/academy-website-plan.pdf` (6 pp., Arabic) | Scope, the four sections, the program model (8 sessions, Sep→Apr), the three build phases, the ≈$25/month operating target, the 500–600 (max ~1,000) user estimate, and the seven open decisions. It matches the brief in `PROMPT.md`; no contradictions found.             |
| `brand/logo-color.png`, `logo-on-dark.png`               | Prop 1 lockup: red arrow mark + black (or white) calligraphic Arabic wordmark. In the Arabic lockup the mark sits at the **end** side of the wordmark.                                                                                                                      |
| `brand/mark.svg`, `favicon.svg`                          | Single red polygon, `viewBox="0 0 675 814"`, fill `#C3272E`.                                                                                                                                                                                                                |
| `references/01-mission.jpg`                              | The editorial voice: enormous whitespace, a single justified text block placed off-centre, a tiny tracked-uppercase Latin label in the top corner. Arabic and English both justified.                                                                                       |
| `references/02-logo-development.jpg`                     | Arrow → "A" → inverted → triangle. Keffiyeh net appears in the development stages. Concept: abstraction of the Latin "A" from _Academy_.                                                                                                                                    |
| `references/03-logo-variations.jpg`                      | Prop 1 (chosen) and Prop 2, plus mono/grey variants, a stacked variant, and a **Latin lockup** — small `ACADEMY` over bold `FLOOD'S GENERATION`.                                                                                                                            |
| `references/04-profile-navy.jpg`                         | The navy surface is a soft gradient, roughly `#0B3246` → `#052C40`, not a flat fill.                                                                                                                                                                                        |
| `references/05-post-lecture.jpg`                         | Session-poster grammar: thin eyebrow → heavy title → small date/time → speaker name → **short red rule** under the role. Western digits. Cut-out portrait on the end side.                                                                                                  |
| `references/06-post-light-keffiyeh.jpg`                  | The keffiyeh net on **light** paper: a large-scale, very low-contrast lattice of crossed diagonals with a square node at each intersection, tiled across the whole surface. Also: portraits cropped into a rectangle over a navy backdrop, name under, role in a red badge. |
| `references/07-post-duotone.jpg`                         | The navy duotone treatment (Jerusalem, Al-Aqsa, figure in keffiyeh) and the **accent word** — «فلسطين» in red inside a dark-ink headline.                                                                                                                                   |
| `references/08-post-red-accent.jpg`                      | Accent word again — «جيل الطوفان» in red, this time **on a dark navy photograph**.                                                                                                                                                                                          |
| `references/09-post-seminar.jpg`                         | «الساعة 16:00 **بتوقيت القدس**» — the academy's own time convention, in Western digits. A red rule under the CTA «بادر بالمشاركة».                                                                                                                                          |

**Design conclusion.** The identity is _quiet surfaces, heavy type, one red gesture per view_. Red never fills an area larger than a button or a rule, except the mark itself. Every screen we build should pass this test: cover the red, and the layout should still read as finished.

---

## 2. Disagreements and flags

Per the working rules, these are the places where I am not silently following the brief.

**2.1 `mark.svg` is not the inverted triangle.** §2 of the brief describes it as "the abstracted inverted-triangle 'A'". The file actually contains the Prop 1 arrow/chevron mark — the same shape as the lockup. Reference 02 shows the inverted triangle as the _end of a development study_, not as the delivered mark, and Prop 1 (the chosen lockup, per §2) uses the arrow. **I will use `mark.svg` as delivered** — it is the correct mark for the chosen lockup — and will not invent a triangle. If you want the inverted triangle as a secondary device, say so and I will add it as a second asset.

**2.2 Red display type on navy.** §8 forbids red on navy for anything but decoration, because it fails contrast (`#C3272E` on `#0B3246` ≈ 2.0:1). But references 07 and 08 _do_ set the accent word in red on dark, and it is one of the most recognisable things the brand does. My resolution: **follow the brief on the site** — on navy the accent word is white and the red appears only as mark and rule — and **allow red display accent only inside generated OG images**, which are pictures, not text, and carry a full text alternative. I'd rather flag this than lose the brief's contrast rule. If you prefer brand fidelity over WCAG here for hero display type only, it's a one-token change and I'll make it.

**2.3 The English lockup is missing from `_context/`.** Reference 03 shows a Latin lockup (`ACADEMY` / `FLOOD'S GENERATION`) but no file was supplied. In `/en` I will use the mark plus type-set Poppins rather than fake the lockup. Added to `TODO.md`.

**2.4 Applications must not be publicly creatable through the REST API.** §6 says "Public can create only". If I set Payload's `create` access to `true`, that also opens `POST /api/applications` to the internet, bypassing the honeypot and the rate limiter. Instead: **`create` access is staff-only**, and the public submission path is a server action that calls the Local API with `overrideAccess: true` _after_ validation, honeypot, and rate-limit checks pass. Same outcome for editors, no open endpoint. Same for Contact messages.

**2.5 Hosting economics.** The ≈$25/month target is comfortable, but not on Vercel: Vercel Pro alone is $20/seat before a database, and commercial use is outside the Hobby terms. A single small VPS (Hetzner CX22 or equivalent, ~$5–6) running the included `Dockerfile` + Postgres + a volume, with Cloudflare in front, lands around **$6–10/month all-in** and leaves headroom. I'll keep the app deployable both ways as instructed and document both in `DEPLOY.md` with real numbers, but my recommendation will be the VPS. No deployment happens this phase.

**2.6 TypeScript 7.** The current stable `typescript` is `7.0.2` (the native compiler; the 5.x line jumped straight to 7). It is new enough that Payload's generated types and the Next plugin may not be fully exercised against it. I will **attempt TS 7 at M1 and fall back to the last 5.x line if `pnpm check` is not clean**, and record whichever we land on in `CLAUDE.md`. I won't spend M1 fighting a compiler.

**2.7 Badge corner radius.** §8 says the brand is angular — 2px radius, no pills. Reference 06 uses a visibly rounded red badge for instructor roles. I'm following the brief (2px) for consistency with buttons; it reads more editorial, which is the stated intent.

---

## 3. Verified stack versions

Checked against the npm registry today, not from memory.

| Package                                | Version | Note                                                               |
| -------------------------------------- | ------- | ------------------------------------------------------------------ |
| `next`                                 | 16.3.4  |                                                                    |
| `payload` + `@payloadcms/*`            | 3.89.0  | `@payloadcms/next` declares `next: >=16.2.6 <17` — **compatible**. |
| `react`                                | 19.3.0  |                                                                    |
| `tailwindcss` / `@tailwindcss/postcss` | 4.3.3   |                                                                    |
| `next-intl`                            | 4.14.3  | peer allows `next ^16`                                             |
| `zod`                                  | 4.6.2   | v4 API                                                             |
| `react-hook-form`                      | 7.87.0  |                                                                    |
| `@playwright/test`                     | 1.63.0  | + `@axe-core/playwright` 4.13.0                                    |
| `vitest`                               | 5.0.0   |                                                                    |
| `lucide-react`                         | 1.44.0  |                                                                    |
| `typescript`                           | 7.0.2   | see 2.6                                                            |

Local toolchain: Node v22.16.0 ✓, Docker 28.4.0 ✓, git 2.49.0 ✓. **pnpm is not installed** — M1 starts by enabling it via `corepack`. No Postgres client locally; Docker Compose supplies the database, and `psql` isn't required.

---

## 4. Architecture

### 4.1 One app, two route groups

Payload 3 runs inside the Next app. Two top-level route groups, each with its own root layout, so Payload's admin CSS and our Tailwind never meet:

```
src/app/
  (frontend)/            ← our root layout: <html lang dir>, fonts, globals.css
    [locale]/…
    sitemap.ts · robots.ts · opengraph-image routes
  (payload)/             ← Payload's root layout: imports @payloadcms/next/css only
    admin/[[...segments]]/page.tsx
    api/[...slug]/route.ts · api/graphql/route.ts
```

There is deliberately **no `src/app/layout.tsx`** — a shared root layout would leak Tailwind's preflight into `/admin`.

### 4.2 Locale routing

`next-intl` middleware with `localePrefix: 'always'`, locales `['ar','en']`, default `ar`. `/` negotiates on `Accept-Language` and falls back to Arabic. The middleware matcher **excludes** `/admin`, `/api`, `/_next`, `/media`, and files with extensions — otherwise Payload's admin would be rewritten to `/ar/admin`.

Payload localization uses the same two codes with `fallback: true → ar`, so a document translated only into Arabic renders its Arabic fields under `/en` (with the small notice required by §9) instead of 404ing.

Adding a locale later = one entry in `src/i18n/routing.ts`, one entry in `payload.config.ts`, one `messages/xx.json`. Nothing else.

### 4.3 Data access layer

Pages never call Payload directly. Everything goes through `src/lib/queries/*`, which:

- always passes `locale` and `fallbackLocale`,
- always filters `status: 'published'` for public reads,
- **strips `zoomJoinUrl` and never selects `zoomPasscode`** unless the join window is open (§4.5). This is why it lives in the data layer and not in a component — a component that forgets is a leak; a query that forgets is one place to fix.

### 4.4 Time

- `startsAt` stored UTC.
- Primary display in the academy zone from SiteSettings (default `Asia/Hebron`), labelled «بتوقيت القدس» / "Al-Quds time", exactly as reference 09 does.
- Visitor-local time rendered client-side with `Intl.DateTimeFormat().resolvedOptions().timeZone`, suppressed when it equals the academy zone (no "16:00 / 16:00").
- Western digits in both locales (`numberingSystem: 'latn'`), matching every brand post.
- Pure functions in `src/lib/time/*`, unit-tested with frozen clocks — including the DST boundaries, since Palestine's transitions don't align with Europe's.

### 4.5 Join-window enforcement

SiteSettings `joinLinkVisibility`: `always` | `window` (default) | `email-only`.

In `window` mode the URL is absent from the HTML until `start − 30min`, and removed after `start + duration`. Pages that show sessions use `revalidate = 60`; a small client component knows the next state-boundary timestamp and calls `router.refresh()` when it passes, so "starting soon" → "live now" flips without a reload and without polling. Worst-case staleness is 60s against a 30-minute window — acceptable, and no per-request rendering cost.

Session states: `upcoming · starting-soon · live · completed · cancelled`, each with a distinct non-colour cue (label text) as well as colour.

### 4.6 Forms

`react-hook-form` + a zod schema shared by client and server → server action → Local API with `overrideAccess: true`. Honeypot field, plus an in-process token-bucket rate limiter keyed by IP hash (sufficient for a single instance at this traffic; a note in `DEPLOY.md` covers what to swap in if we ever scale horizontally). Turnstile behind `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — absent key, no widget, no code path.

---

## 5. Route map

All public routes under `/[locale]`. "Render" = caching strategy.

| Route                                                              | Render                                                                          | Notes                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `/`                                                                | ISR 300s + 60s for the session strip                                            |                                                           |
| `/about`                                                           | ISR                                                                             | anchored: intro · vision & mission · goals                |
| `/about/structure`                                                 | ISR                                                                             | councils & teams                                          |
| `/projects` · `/projects/[slug]`                                   | ISR + `generateStaticParams`                                                    |                                                           |
| `/programs`                                                        | ISR                                                                             | Open Training featured, four directed, strategic projects |
| `/programs/[slug]`                                                 | ISR 60s                                                                         | six pages, one template                                   |
| `/schedule`                                                        | ISR 60s                                                                         | `?program=` filter, shareable                             |
| `/events` · `/events/[slug]`                                       | ISR                                                                             | camp gets the rich layout                                 |
| `/knowledge` · `/knowledge/minbar[/slug]` · `/knowledge/materials` | ISR                                                                             |                                                           |
| `/instructors` · `/instructors/[slug]`                             | ISR                                                                             |                                                           |
| `/students`                                                        | ISR                                                                             | program picker is a client component                      |
| `/apply` · `/apply/[programSlug]`                                  | dynamic                                                                         |                                                           |
| `/contact` · `/privacy` · `/terms`                                 | static                                                                          |                                                           |
| `/styleguide`                                                      | dynamic, **404s when `NODE_ENV === 'production'`** unless `ENABLE_STYLEGUIDE=1` |                                                           |
| `not-found`                                                        | static                                                                          | bilingual                                                 |
| `/sitemap.xml` · `/robots.txt`                                     | generated                                                                       | both locales, `hreflang` alternates                       |
| `/api/og/…`                                                        | edge-ish runtime                                                                | brand OG template                                         |

Primary nav stays five items: **الأكاديمية · البرامج · الجدول · المعرفة · الفعاليات** + language switch + «سجّل الآن». Student and Instructor windows live in the header utility row, the footer, and contextual links from program/session pages.

---

## 6. Content model

Every collection: `status` (draft|published), `slug`, SEO group (title, description, ogImage), `isPlaceholder`. Every human-readable field `localized: true`.

| Collection          | Key fields                                                                                                                                                                                         | Public access                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Programs**        | title, track(`open`                                                                                                                                                                                | `directed`), shortDescription, intro(RT), goals[], targetAudience(RT), durationSummary, season{startMonth,endMonth}, sessionsCount=8, coverImage, accentMotif, instructors↔, registrationMode(`open` | `application`                                                                                                                | `closed`, default `application`), registrationDeadline, order, featured | read published |
| **Sessions**        | program↔, number 1–8, title, summary, details(RT), instructors↔, startsAt(UTC), durationMinutes, zoomJoinUrl, zoomMeetingId, **zoomPasscode (field-level staff-only read)**, status, materialsNote | read published, join fields gated §4.5                                                                                                                                                               |
| **Instructors**     | name, role, shortBio, bio, photo, links[], programs (join)                                                                                                                                         | read published                                                                                                                                                                                       |
| **Events**          | title, type(`camp`                                                                                                                                                                                 | `activity`                                                                                                                                                                                           | `seminar`), startDate, endDate, location/online, summary, body(RT), programme[day→items[]], gallery[], registrationLink/mode | read published                                                          |
| **Projects**        | title, summary, body, image, status                                                                                                                                                                | read published                                                                                                                                                                                       |
| **MinbarPosts**     | title, excerpt, body, cover, author(↔Instructors \| text), publishedAt, tags[]                                                                                                                     | read published                                                                                                                                                                                       |
| **Materials**       | title, program↔/session↔, type(`pdf`                                                                                                                                                               | `link`                                                                                                                                                                                               | `reading`), file\|url, description                                                                                           | read published                                                          |
| **Applications**    | program↔, fullName, email, phone, country, city, ageRange, motivation, hearAbout, consent, locale, status(`new`…`rejected`), notes                                                                 | **none** — see 2.4; staff read/update; CSV export                                                                                                                                                    |
| **ContactMessages** | name, email, subject, message, status                                                                                                                                                              | **none**                                                                                                                                                                                             |
| **Users**           | email, name, role(`admin`                                                                                                                                                                          | `editor`)                                                                                                                                                                                            | staff only                                                                                                                   |
| **Media**           | alt **(required)**, focal point, sizes                                                                                                                                                             | read all                                                                                                                                                                                             |

**Globals:** `SiteSettings` (contact email, socials, `academyTimeZone`, `joinLinkVisibility`, announcement bar), `HomePage` (hero copy + per-section toggles, stats band **off**), `AboutPage`, `Navigation`, `Footer`.

Uploads: PDF and image MIME types only, 20 MB cap, `alt` required.

**Globals wired to the interface** (every field falls back to `messages/*.json` while empty): `SiteSettings` (contact email, WhatsApp, socials, time zone, join-link policy, announcement bar, statistics), `HomePage` (hero copy + background photo, section toggles, closing CTA), `Navigation` (primary, utility, CTA), `Footer` (blurb, columns, bottom note), `AboutPage`, `StudentsPage` (intro, how live sessions work, how to join, code of conduct, FAQ, account-card toggle), `InstructorsPage` (intro, guidelines, materials, my-sessions copy).

**Phase 2 seam:** `Users` is already an auth collection with a `role` field and a `staffOnly` access helper. Adding `Students`/`Instructors` auth collections later means new collections + new role checks — no migration of existing data, no route restructuring, because `/students` and `/instructors` already exist as routes.

---

## 7. Design system

### 7.1 Tokens

Colour tokens exactly as §8 of the brief, declared as CSS custom properties in `src/styles/tokens.css` and exposed to Tailwind v4 via `@theme`. Contrast to be verified in the M7 axe pass; `--ink-500` on `--paper-2` is the one I expect to need checking.

Navy surfaces use the **gradient** from reference 04 (`--navy-800` → `--navy-900`, ~160°), not a flat fill.

### 7.2 Type

Poppins (`next/font/google`) + IBM Plex Sans Arabic (`next/font/google`) as the Janna LT stand-in. Single stack in both locales — `var(--font-latin), var(--font-arabic), system-ui, sans-serif` — so Latin glyphs and digits come from Poppins and Arabic falls through.

Swapping to Janna LT = drop licensed files into `public/fonts/janna/` and change **one** `next/font/local` declaration in `src/styles/fonts.ts`.

Fluid scale, ~1.25 ratio, `clamp()`-based, tokens only. Arabic body 17–18px / 1.8. English 16–17px / 1.65. Measure 60–72ch. **A lint rule and a styleguide check will guard against `letter-spacing` or `text-transform` landing on Arabic text.**

### 7.3 The six motifs

1. **Red rule** — 48×3px at the start edge under section headings. (`<SectionHeading>`)
2. **Ordinal labels** — «أولًا · ثانيًا…» / `01 · 02…`, tracked uppercase in Latin only.
3. **The mark as accent** — current timeline station, active nav indicator, key list bullets, and a corner notch at the **top-start** of featured cards. Never distorted, never recoloured except white-on-red.
4. **Keffiyeh net** — an original geometric SVG tile (crossed diagonals + square nodes, as in ref 06), one file, two treatments: 4–6% ink on `--paper-2`, 6–8% white on navy. Never behind body copy.
5. **Navy duotone** — `<DuotoneImage>` wrapping `next/image`, CSS-only (grayscale → duotone via blend layers), with `treatment="none"` for the camp gallery. Degrades to the plain photo if blend modes are unsupported.
6. **Accent word** — `**word**` in a title field renders red (ink-red on light; white on navy, per 2.2). A tiny parser in `src/lib/accent.ts`, applied only to hero and section titles.

### 7.4 Component inventory

`Button` · `Link` · `SectionHeading` · `OrdinalLabel` · `ProgramCard` · `SessionRow` · `DateBlock` · `StatusBadge` · `InstructorCard` · `EventCard` · `SeasonTimeline` · `Accordion` · `Tabs` · `Callout` · `Breadcrumbs` · `LanguageSwitch` · `Gallery`+`Lightbox` · `Pattern` · `DuotoneImage` · `Field`/`Input`/`Textarea`/`Select`/`Checkbox` · `EmptyState` · `Loader` · `Toast` · `Logo` · `Mark` · `AddToCalendar` · `LocalTime` · `Prose`.

Every one of them appears in `/styleguide`, in every state, in both directions. That page is the review surface.

### 7.5 Motion

150–250ms ease-out on hover and disclosure; one 8px fade-up per element on first view via `IntersectionObserver`. No library. Full `prefers-reduced-motion` honour — reduced motion means _no_ transform, not a shorter one.

---

## 8. Seed data

Idempotent (upsert by slug), safe to re-run.

| Slug                     | AR                 | EN                               | Track    |
| ------------------------ | ------------------ | -------------------------------- | -------- |
| `open-training`          | التدريب المفتوح    | Open Training                    | open     |
| `palestine-our-compass`  | فلسطين بوصلتنا     | Palestine, Our Compass           | directed |
| `leaders-of-tomorrow`    | قادة الغد          | Leaders of Tomorrow              | directed |
| `impact-makers`          | صنّاع الأثر        | Impact Makers                    | directed |
| `community-pioneers`     | روّاد المجتمع      | Community Pioneers               | directed |
| `ambassadors-of-al-quds` | سفراء القدس الشريف | Ambassadors of Al-Quds Al-Sharif | directed |

Slugs are English/transliterated and stable; the auto-transliteration utility exists for editor-created content, but these six are pinned.

Each program gets **8 sessions**, one per month Sep 2026 → Apr 2027, titled `[الحصة الأولى]` etc., `isPlaceholder: true`, no Zoom URLs. Plus: the Camp as an `event` of type `camp`; `AboutPage` with the **real mission text, verbatim, both languages**; placeholder `SiteSettings`. Instructors are seeded as «[اسم المحاضر]» with no photos and no invented biography — 48 sessions therefore have no instructor attached, which is correct and will render as a hidden field, not an empty slot.

**Nothing about real people, dates, numbers, or quotes is invented anywhere.**

---

## 9. Quality gates

`pnpm check` = `tsc --noEmit` + `eslint` + `prettier --check` + `vitest run`. Run at every milestone end.

- **a11y:** WCAG 2.2 AA; axe on every route in both locales, zero serious/critical. Keyboard paths for accordion, mobile menu, lightbox, language switch, and the apply form are explicit Playwright tests, not spot checks.
- **perf:** Lighthouse mobile ≥95 across all four categories on `/` and a program page. The main risks are the hero image and font loading; both are budgeted for from the start rather than optimised at M7.
- **SEO:** localized `generateMetadata`, canonicals on `https://jilaltufan.org`, sitemap (both locales), `hreflang`, JSON-LD (`EducationalOrganization` sitewide, `Course` per program, `Event` per session/event), OG images from the brand template.
- **security:** CSP with per-request nonce, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame-ancestors. Payload's admin needs its own relaxed CSP branch — noted as a known friction point (9.1 below).
- **screenshots:** Playwright captures every touched page, both locales, at 375 / 768 / 1280 / 1440, written to `.artifacts/screens/<milestone>/`. I compare them against `_context/brand/references/` and report honestly, including what still looks wrong.

### 9.1 Known risks

| Risk                                                                     | Mitigation                                                                                   |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Payload admin + a strict CSP fight (inline styles, `unsafe-eval` in dev) | Separate header rules for `/admin` in `next.config.ts`; verified at M2, not M7.              |
| Tailwind v4 preflight leaking into `/admin`                              | No shared root layout (§4.1). Verified by an M1 Playwright screenshot of `/admin`.           |
| TS 7 immaturity                                                          | §2.6 — timeboxed at M1, documented fallback.                                                 |
| `next-intl` middleware swallowing `/admin`                               | Explicit matcher exclusions; M1 smoke test hits `/admin` and `/api/health`.                  |
| Arabic font fallback flashing / wrong metrics                            | `display: swap` + `adjustFontFallback`; visual check at M1 at all four widths.               |
| Duotone via CSS blend inconsistent across browsers                       | Feature-detect; plain photo fallback. Chromium/WebKit/Firefox screenshots at M3.             |
| Payload + Next 16 edge cases (new pairing)                               | Both pinned exactly; upgrade only deliberately.                                              |
| DST: Palestine transitions differ from Europe/US                         | Frozen-clock unit tests across both 2026 transitions.                                        |
| Editors publishing a session without a Zoom link                         | Admin validation + an `EmptyState` that says so plainly rather than rendering a dead button. |

---

## 10. Milestones

Each ends with: `pnpm check` → Playwright screenshots (both locales × 4 widths) → honest comparison against the references → fixes → commit → short summary to you.

| #      | Scope                                                                                                                                                             | Done when                                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **M0** | `PLAN.md`, `CLAUDE.md`, `TODO.md`                                                                                                                                 | **You approve this file.**                                                                                               |
| **M1** | pnpm via corepack, Next 16 + Payload 3 + Postgres in Docker, route groups, locale routing, tokens, fonts, header/footer shell, `/styleguide` with base components | `/ar` and `/en` render the shell; `/admin` loads unstyled-by-us; styleguide shows tokens + 10 components both directions |
| **M2** | All collections, globals, access control, admin grouping in Arabic, seed script                                                                                   | An editor can log in, see Arabic grouped nav, and the six programs with 48 sessions exist                                |
| **M3** | Home, About, Structure, Programs index, Program template                                                                                                          | All six program pages render from one template; home has all nine sections with correct empty-state behaviour            |
| **M4** | Sessions, `/schedule` + filter, join-window logic + unit tests, `.ics` + Google Calendar, Events, Camp, Projects                                                  | Window logic proven by frozen-clock tests; no join URL in HTML outside the window                                        |
| **M5** | Apply flow, confirmation + notification emails, admin triage, CSV export, honeypot + rate limit                                                                   | An application submitted in `/en` arrives in admin and both emails fire (console in dev)                                 |
| **M6** | Student window, Instructor window + profiles, Knowledge hub, Minbar, Materials, Contact, privacy, terms, 404                                                      | Every route in §5 returns 200 in both locales                                                                            |
| **M7** | a11y pass, perf pass, SEO, full Playwright suite, `README.md` (<5 min setup), `DEPLOY.md`, final `TODO.md`                                                        | Zero serious/critical axe violations; Lighthouse ≥95×4 on `/` and a program page                                         |

---

## 11. Defaults taken on the seven open decisions

1. **Programs at launch** — all six seeded; `status` hides any of them.
2. **Content per program** — full template; empty fields hide cleanly, no empty headings.
3. **Registration** — per-program `registrationMode`, **default `application`**.
4. **Accounts** — not in MVP; `Users` + `/students` + `/instructors` are the Phase 2 seam.
5. **Volume** — env-driven storage adapter, 20 MB cap, PDF + images only.

Still yours to decide (tracked in `TODO.md`): the English name usage, `jilaltufan.org` registration, `contact@jilaltufan.org`, social links, the Janna LT licence, SVG logo files, the English lockup, and real photography.

---

## 12. Definition of done

An editor publishes a program with eight sessions and Zoom links, publishes an event, triages applications, and switches any page between Arabic and English — without a developer. A student on a phone finds their program, sees the next session in their own time, joins it at the right moment, and applies. And the result looks like أكاديمية جيل الطوفان and nothing else.

---

**→ Awaiting your approval before M1.** Corrections to any of §2 are welcome; I'd rather change the plan than the code.

**Season (revised Sep 2026 from the founding paper):** the academy year runs October → June for the timeline; open training is 8 lectures Oct → May, the four directed programs are 6 sessions Jan → Jun, graduation projects and the camp fall in September. Between July and September the home timeline shows the coming season. Season labels on cards come from each program's own fields (`src/lib/program.ts`), never from a fixed string.

---

## 13. Phase 2 — the student and instructor windows (designed 2026-09-23)

§11.4 left accounts out of the MVP and named `Users` + `/students` + `/instructors` as the
seam. This is that seam, opened. Today both windows are public, unauthenticated pages and
the only auth collection is staff (`Users`); an applicant's whole relationship with the
academy is their email address and the four status letters.

### 13.1 The decisions (2026-09-23)

1. **Two triggers, not one.** Submitting an application creates **no account**: the
   confirmation letter carries a signed, expiring link to a page showing that one
   application's status. The account is created **on acceptance**. This revises the
   2026-09-21 Minbar decision (an account by applying) and needs the academy's sign-off —
   `TODO.md`. It means «حساب» is a student of the academy, not anyone who filled a form:
   no credentials held for rejected applicants, and no account spam feeding comment spam.
2. **No password is ever emailed.** Accounts are created password-less and unverified; the
   letter carries a single-use, time-limited link to a page on this site where the person
   chooses their own password. An expired link offers «أرسل رابطًا جديدًا» and re-issues
   itself — staff are never in the loop. An emailed password would sit in that mailbox
   forever, survive any "change it on first login" step, and cost us deliverability on the
   same domain that sends acceptance letters.
3. **A guest instructor is invited by staff.** When a guest is confirmed, an editor creates
   the profile and ticks «أرسل دعوة»; the guest gets the same set-password link. No account
   exists until there is a session to teach — which is what «المحاضرون ضيوف» (2026-09-21)
   means in practice.
4. **Attendance comes from Zoom, and staff can correct it.** The academy will hold a Zoom
   Business plan, so the participant report is the default register; staff marking is the
   fallback when nobody syncs, and the override when Zoom is wrong. A staff mark always
   wins and a later sync never overwrites it.
5. **Minbar commenting is held.** The comments collection and its moderation are out of
   this phase by decision; the account it would have needed is being built here anyway.

### 13.2 One auth collection, never the public profile

Payload injects the auth `email` field with **no access control**
(`payload/dist/auth/getAuthFields.js`), and every public read in `src/lib/queries/*` runs
`overrideAccess: false`. So an auth collection is a collection whose email column is as
readable as the collection is — and `instructors` is published to the world. Credentials
therefore never go into a public collection, which rules out making `Instructors` an auth
collection (checked 2026-09-23; it also revises the note in `Users.ts` about _two_ new auth
collections).

- **`accounts`** — the one non-staff auth collection: `kind` (`student` | `instructor`),
  `locale`, a relationship to the `applications` row (students) or the `instructors`
  profile (instructors), and nothing public. `access.admin` is `() => false`, so an account
  can never enter `/admin` whatever else goes wrong; read/update are self-or-staff.
- **`instructors`** stays exactly what it is — a public profile with no email and no
  password. The account points at it, not the other way round.
- `src/access/index.ts` already keys every staff rule on `u.collection === 'users'`, so a
  new auth collection cannot inherit staff rights by accident. It gains `isAccount`,
  `isStudentAccount`, `isInstructorAccount` in the same shape.

### 13.3 The three doors

| Door              | Who                            | Carries                                                          | Expiry                                                                     |
| ----------------- | ------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Status link       | every applicant, at submission | `/[locale]/application/[token]` — that application's status only | opaque token + expiry on the row, staff-read-only, never in a public query |
| Student invite    | on `accepted`                  | set-password link in the acceptance letter                       | Payload's verification token                                               |
| Instructor invite | when staff tick «أرسل دعوة»    | the same set-password link                                       | Payload's verification token                                               |

Sign-in afterwards is email + the password they chose, on our own pages with the site's own
form controls (no native `<select>`, no native pickers — the 2026-09-18 rules apply here as
everywhere). Honeypot and the existing rate limit go on sign-in, forgot, and set-password,
as on every public write.

### 13.4 What each window holds

**Student** — application status and the documents they sent · their program's sessions
with join links (through the existing join-window gate in the query layer, which is also
where an `email-only` policy would be honoured) · materials for their program · progress:
sessions attended against the program's total · their personal information, editable.

**Instructor** — their upcoming session and its join link · materials to upload for it ·
their own bio and photo, editable · past sessions they taught.

`zoomPasscode` stays staff-only in both. The window is not a way around a field rule.

### 13.5 Attendance and progress

A row per person per session (`attendance`): session, account, state
(`present` | `absent` | `excused`), `source` (`zoom` | `staff`), minutes attended, and who
recorded it. Zoom's Server-to-Server OAuth app reads
`/report/meetings/{id}/participants` after a session ends and matches by email —
`zoomMeetingId` is already on `Sessions`. Matching is imperfect by nature (a different
email, a phone join), which is why `source: 'staff'` is sticky: the sync writes and updates
only rows it owns. Progress in the window is attended ÷ the program's session count; the
founding paper's continuation and graduation criteria can key off the same rows later.

### 13.6 Rendering and caching — these routes are different

Every page behind a login is per-visitor: `force-dynamic`, `Cache-Control: private,
no-store`, and **never** in the static build table (§ "Static rendering — the two traps" in
`CLAUDE.md` is about public pages; this is the documented exception). The account link lives
in the footer, the mobile menu, and contextual links — **not** in the header, which stays
one row by the 2026-09-18 feedback.

### 13.7 What it touches in code that exists

- `src/collections/hooks/status-email.ts` — the `accepted` branch also creates the account
  and sends the invite; the same "stamp it, never send twice" discipline applies.
- `src/lib/email/templates.ts` — four new letters (status link, student invite, instructor
  invite, password reset) in both languages. The submission confirmation gains one line
  with the status link, which changes a template the academy is already reviewing.
- Migrations: `accounts`, `attendance`, the token fields on `applications`. The `activity`
  `target` enum is a schema change if account sign-ins are logged — decide first
  (they are not staff writes; a separate register may be the honest answer).
- `pnpm generate:types` after each collection change; `pnpm generate:importmap` if any
  admin Cell is added; Neon migrated **before** the next push, per `TODO.md`.

### 13.8 Order of work

1. **The status link** — token on `Applications`, the page, the line in the confirmation
   letter. No auth at all, and it reaches every applicant immediately.
2. **`accounts` + the doors** — collection, sign-in / set-password / forgot, the session
   read in RSC, the empty `/account` shell.
3. **The student window** — status and documents, sessions and join links, materials,
   personal information.
4. **The instructor invite and window** — «أرسل دعوة», their session, upload, bio.
5. **Attendance by hand** — the collection and the staff marking UI; progress in the window.
6. **Zoom sync** — S2S OAuth, the report pull, reconciliation that never overwrites staff.
7. _(held)_ Minbar commenting.
