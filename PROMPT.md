# Kickoff Prompt — Jil Altufan Academy Website (MVP)

> Paste everything below the line into Claude Code, from the root of an empty repository that contains the `_context/` folder.
> Before pasting, replace every `{{…}}` placeholder (domain, contact email). Anything you leave unfilled, Claude will keep as a placeholder and list in `TODO.md`.

---

## 0. Your role and how we work

You are a senior full-stack engineer and a pixel-precise UI/UX designer building the official website of **أكاديمية جيل الطوفان — Jil Altufan Academy** (brand English lockup: _Academy · Flood's Generation_). The site is Arabic-first, bilingual (Arabic + English) from day one, and must feel **classical, minimal, and editorial**, grounded in the academy's visual identity (هوية) rather than in generic "EdTech" templates.

Working rules:

1. **Plan before code.** Start by reading everything in `_context/` (see §2). Then write `PLAN.md` (information architecture, data model, component inventory, route map, risks, and your milestone breakdown) and a concise `CLAUDE.md` (conventions future sessions must follow). **Stop and wait for my approval** of `PLAN.md` before writing application code. If you disagree with any decision in this prompt, say so in `PLAN.md` with your reasoning — don't silently deviate.
2. **Build in milestones** (§14). At the end of each milestone: run typecheck, lint, and tests; take Playwright screenshots of every page touched in **both locales** at 375, 768, 1280, and 1440 px; compare them honestly against the brand references in `_context/brand/references/`; fix what's off; then commit with a clear message and give me a short summary.
3. **Never invent facts.** No fake instructors, fake dates, fake statistics, fake testimonials, or fake quotes. Where content is missing, use clearly marked placeholders (`[نص مؤقت]` / `[Placeholder]`), flag seeded records with `isPlaceholder: true`, and log what's needed in `TODO.md`. Don't block on missing information — placeholder it and keep moving.
4. **Scope discipline.** Build the MVP (§3) well rather than half-building later phases. But architect so Phase 2 (accounts, instructor dashboard, materials, payments) slots in without rewrites.
5. Use the latest stable versions of the stack in §4, and check current official docs when an API may have changed rather than relying on memory.

## 1. Project context

**What the platform is.** Not merely a site for studying at the academy, but its main digital home: it presents the academy, its programs, courses, lectures, participants, and content, and will grow later into a full learning platform.

**Mission (use verbatim):**

- AR: تقوم رسالة الأكاديمية على تمكين الشباب العربي والإسلامي، من خلال برامج تربوية ومعرفية وسياسية مكثّفة ومواكبة لتحديات ورهانات الطوفان، حيث تعتمد على مناهج علمية وأدوات عملية، لتعزيز الهوية ونصرة القضية الفلسطينية في مختلف الميادين.
- EN: The Academy's mission is to empower Arab and Muslim youth through intensive educational, cognitive, and political programs that keep pace with the challenges and stakes of the flood, relying on scientific curricula and practical tools to strengthen identity and support the Palestinian cause in various fields.

**Tagline (from brand material):** «بالعلم نتحرّر» — EN: "Through knowledge, we are liberated."

**Brand keywords:** فلسطين · شباب · أكاديمية · طوفان · هوية · معاصر (Palestine · youth · academy · flood · identity · contemporary).

**Audience:** Arab and Muslim youth (expect ~500–600 users initially, never more than ~1,000 in year one), their instructors, and the academy's staff who will edit content. Most visitors are on mobile.

**The four site sections:**

1. **الأكاديمية / The Academy** — about, vision & mission, goals, structure (councils & teams), projects & initiatives.
2. **البرامج التدريبية / Training Programs**
   - **التدريب المفتوح / Open Training** — an independent track for a wider audience: 8 lectures per season, one per month, September → April.
   - **البرامج الموجّهة / Directed Programs** — five programs, each 8 sessions per season, one per month, September → April:
     فلسطين بوصلتنا (Palestine, Our Compass) · قادة الغد (Leaders of Tomorrow) · صنّاع الأثر (Impact Makers) · روّاد المجتمع (Community Pioneers) · سفراء القدس الشريف (Ambassadors of Al-Quds Al-Sharif).
3. **المحتوى والمعرفة / Content & Knowledge** — منبر الطوفان (Minbar Altufan), lectures and learning materials, articles (added later).
4. **الفعاليات / Events** — مخيمات جيل الطوفان (the annual, week-long Jil Altufan Camp) and other academy activities.

**Delivery model:** all sessions are **live on Zoom**. There are no recorded videos and no video hosting. Operating budget target after launch: **≈ $25/month** — make choices that respect it.

## 2. Files provided in `_context/`

- `docs/academy-website-plan.pdf` — the academy's approved concept and phased plan (Arabic). Read it fully; it is the source of truth for scope.
- `brand/logo-color.png` — primary logo (Prop 1: calligraphic lockup), transparent background, for light surfaces.
- `brand/logo-on-dark.png` — same lockup with white wordmark, for navy surfaces.
- `brand/mark.svg` — the logo mark alone (the abstracted inverted-triangle "A"), traced precisely from the logo geometry. Use for favicon, compact header, loaders, and decorative accents.
- `brand/favicon.svg` — padded square version of the mark.
- `brand/references/*.jpg` — pages from the brand identity book: mission, logo development, variations, and social-post applications. These define the visual mood. Study them before designing.

Note: the logo PNGs are raster exports. Build the site so swapping in SVG logos later is a one-file change (`/public/brand/`), and add "obtain SVG logo files from the designer" to `TODO.md`.

## 3. MVP scope

**In scope (Phase 1):**

- Home page.
- Academy pages (about, vision & mission, goals, structure, projects & initiatives).
- Programs index + one dedicated page per program (template in §7).
- Live-sessions schedule with Zoom join links (rules in §10).
- Events (incl. a dedicated Camp page) and projects.
- Registration / application flow (per-program mode, §10).
- **Student window** and **Instructor window** — clear, interlinked entry points for each audience (§7). No logins in the MVP.
- Content & Knowledge section in a light form (Minbar posts + materials listing), because editors can fill it through the CMS at near-zero extra cost.
- Contact, privacy, terms, and a 404 page.
- Arabic (default, RTL) + English (LTR), with adding Turkish/Spanish/French later being configuration-only.
- Fully responsive, mobile-first.
- A simple admin panel for editors (§11).

**Out of scope (Phase 2+), but don't block it architecturally:** student/instructor accounts and login, in-platform Zoom embedding, file uploads by instructors, progress tracking, cohort management, alumni tracking, payments, certificates, quizzes, extra languages, video hosting, mobile apps.

## 4. Tech stack and architecture

- **Next.js (App Router) + TypeScript (strict)**, React Server Components by default; client components only where interaction requires it. Package manager: **pnpm**.
- **Payload CMS 3 embedded in the same Next.js app** (admin at `/admin`) with the **PostgreSQL** adapter. Rationale: it gives us the "simple content-management panel" with field-level localization, media handling, access control, and an auth-capable users model — exactly what Phase 2 accounts will build on — without a second service.
- **Localization:** Payload localization with locales `ar` (default, RTL) and `en`, fallback to `ar`. UI strings via **next-intl** with a `[locale]` route segment and middleware. Arabic is served at `/ar/...`, English at `/en/...`; `/` redirects based on `Accept-Language`, defaulting to Arabic. Payload's admin UI should be available in Arabic.
- **Database:** Postgres via Docker Compose locally; production provider decided at deploy time — keep it to a single `DATABASE_URL`.
- **Media storage:** local filesystem in development; an S3-compatible storage adapter in production, enabled purely by env vars.
- **Styling:** **Tailwind CSS v4** driven by CSS custom-property design tokens (§8). Use logical utilities and properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`) — never hard-code left/right.
- **Forms:** react-hook-form + zod, submitted via server actions that write through Payload's Local API. Shared zod schemas for client and server validation.
- **Email:** Payload email adapter (Resend or SMTP, env-driven). In development, log emails to the console.
- **Anti-spam:** honeypot field + server-side rate limiting on all public forms; Cloudflare Turnstile optional behind an env flag.
- **Icons:** lucide-react, stroke width 1.5, used sparingly.
- **Testing:** Playwright (smoke tests for every route in both locales, registration happy path, locale switch, schedule logic) with `@axe-core/playwright`; Vitest for utilities (time-zone and join-window logic especially).
- **Quality tooling:** ESLint, Prettier, `tsc --noEmit` in a single `pnpm check` script.
- **Deployment:** don't deploy in this phase. Keep the app deployable to Vercel _or_ a Docker host; include a production `Dockerfile` and a `DEPLOY.md`. Production domain: `jilaltufan.com` (set as `NEXT_PUBLIC_SITE_URL`).

## 5. Information architecture and routes

All public routes live under `/[locale]`:

| Route                                           | Purpose                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `/`                                             | Home                                                                 |
| `/about`                                        | About, vision & mission, goals (anchored sections)                   |
| `/about/structure`                              | Councils & teams                                                     |
| `/projects`, `/projects/[slug]`                 | Projects & initiatives                                               |
| `/programs`                                     | Programs index (Open Training highlighted + 5 directed programs)     |
| `/programs/[slug]`                              | Program page (template §7)                                           |
| `/schedule`                                     | All upcoming live sessions, filterable by program                    |
| `/events`, `/events/[slug]`                     | Events; the Camp is an event of type `camp` with its own rich layout |
| `/knowledge`                                    | Content & Knowledge hub                                              |
| `/knowledge/minbar`, `/knowledge/minbar/[slug]` | Minbar Altufan posts                                                 |
| `/knowledge/materials`                          | Lectures & learning materials                                        |
| `/instructors`, `/instructors/[slug]`           | Instructor window + profiles                                         |
| `/students`                                     | Student window                                                       |
| `/apply` and `/apply/[programSlug]`             | Registration / application                                           |
| `/contact`, `/privacy`, `/terms`                | Utility pages                                                        |

Primary navigation (keep it short and classical): الأكاديمية · البرامج · الجدول · المعرفة · الفعاليات — plus a language switch and a single primary CTA «سجّل الآن». The Student and Instructor windows are reachable from the header's utility row, the footer, and contextually from program and session pages. Everything interlinks: program ↔ sessions ↔ instructors ↔ schedule ↔ apply.

## 6. Content model (Payload)

Localize every human-readable field. Every public collection has `status` (draft/published), `slug` (auto from the Arabic title, transliterated; editable), SEO fields (title, description, OG image), and `isPlaceholder`.

- **Programs** — title, track (`open` | `directed`), shortDescription, intro (rich text), goals (array), targetAudience (rich text), duration summary, season (start month, end month), sessionsCount (default 8), coverImage, accentMotif option, instructors (relation), `registrationMode` (`open` | `application` | `closed`), registrationDeadline, order, featured.
- **Sessions** — program (relation), number (1–8), title, summary, details (rich text), instructors (relation), `startsAt` (stored UTC), durationMinutes, zoomJoinUrl, zoomMeetingId, zoomPasscode (admin-only field, never rendered publicly), status (`scheduled` | `cancelled` | `completed`), materialsNote.
- **Instructors** — name, title/role, shortBio, bio, photo, links, programs (join).
- **Events** — title, type (`camp` | `activity` | `seminar`), dates (start/end), location/online, summary, body, programme (array of day → items), gallery (media), registrationLink/mode.
- **Projects** — title, summary, body, image, status.
- **Minbar posts** — title, excerpt, body, cover, author (relation to Instructors or free text), publishedAt, tags.
- **Materials** — title, program/session relation, type (`pdf` | `link` | `reading`), file or URL, description.
- **Applications** — program, fullName, email, phone/WhatsApp, country, city, ageRange, motivation (textarea), how-did-you-hear, consent (required), locale, status (`new` | `reviewing` | `accepted` | `waitlisted` | `rejected`), internal notes. Public can **create only**; staff can read/update; CSV export in admin.
- **Contact messages** — name, email, subject, message, status.
- **Users** — staff only for now, roles `admin` | `editor`. Design the collection so a `students` / `instructors` auth collection can be added in Phase 2.
- **Globals:** SiteSettings (contact email `{{CONTACT_EMAIL}}`, socials, default time zone, join-link visibility policy, announcement bar), HomePage (editable hero copy and section toggles), AboutPage (vision, mission, goals, structure blocks), Navigation, Footer.

## 7. Page specifications

**Header.** Logo on the start side (right in Arabic). On scroll, compact to the mark plus the wordmark at a smaller size; white background with a 1px hairline bottom rule. Mobile: full-screen menu on navy with the white logo, large type, generous spacing.

**Home** (sections in order; each must earn its place):

1. _Hero_ — navy surface with a subtle duotone photograph of Jerusalem / Al-Aqsa (placeholder: a navy field with the keffiyeh texture, never stock faces), white logo lockup or large tagline «بالعلم نتحرّر», one-line mission, two CTAs (استكشف البرامج / سجّل الآن), and a small "next live session" chip (program, title, date in Al-Quds time).
2. _Mission & pillars_ — the mission paragraph set large and calm, then three pillars from it: تربوية · معرفية · سياسية.
3. _Programs_ — Open Training as a wide feature card, then the five directed programs in a restrained grid.
4. _The season_ — a distinctive horizontal timeline September → April with eight monthly stations (vertical on mobile), expressing "one session every month". Rising, stepped rhythm; the current month is marked with the red mark.
5. _Upcoming sessions_ — next three sessions across programs.
6. _The Camp_ — full-bleed navy band for مخيمات جيل الطوفان.
7. _From Minbar Altufan_ — latest three posts (hidden if none are published).
8. _Instructors_ — a quiet strip of portraits (hidden if none are published).
9. _Closing CTA_ then footer.
   Do not include a statistics band until real numbers exist (keep the component; toggle it off by default).

**Program page** — follow the plan's model page for «فلسطين بوصلتنا», in this order: introduction → goals → target audience → duration → the eight sessions → each session's details → registration & follow-up. Layout: a sticky side rail (start side on desktop) with the program facts (track, duration, 8 sessions, Sep–Apr, registration status + CTA); the eight sessions as a numbered, accessible accordion with deep-linkable anchors (`#session-3`), each showing date/time (Al-Quds + local), instructor, summary, and add-to-calendar. Empty sections hide gracefully. The same template serves all six programs.

**Schedule** — list grouped by month, filter by program (URL query param so filters are shareable), each row: date block, program, session title, instructor, time (Al-Quds and visitor-local), status, join/add-to-calendar actions.

**Events / Camp** — events index as an editorial list; the Camp page has a hero, the week's programme day by day, details, gallery (lightbox, keyboard-accessible), and registration.

**Student window** (`/students`) — one calm page answering "what do I need?": how live sessions work, how to join Zoom, my program's schedule (program picker → filtered sessions), materials for my program, code of conduct, FAQ, contact. Include a clearly designed but inactive "حسابي — قريبًا / My account — coming soon" card as the future login entry point.

**Instructor window** (`/instructors`) — instructor directory plus a "for instructors" panel: session guidelines, how to share materials with the academy (email/contact form for now), schedule of their sessions, contact. Profile pages list the instructor's programs and upcoming sessions.

**Apply** — program chooser (if none selected), then a short, humane form (fields per §6) with inline validation in the visitor's language, clear consent text linked to the privacy page, and a confirmation screen whose wording depends on `registrationMode` (open: "you're registered"; application: "we received your application and will contact you"). Closed programs show the status and a contact link instead of the form.

**404** — bilingual, calm, with the mark and links back to programs and home.

## 8. Design system — "classical, minimal, rooted in identity"

**Design intent.** Think of an academic press or a serious institute, not a startup. Generous whitespace, strong typographic hierarchy, hairline rules, a restrained palette where red is rare and therefore meaningful. Identity comes from the brand's own motifs, used sparingly and consistently — not from decoration.

**Color tokens** (sampled from the logo and brand applications):

| Token        | Value               | Use                                                                                                 |
| ------------ | ------------------- | --------------------------------------------------------------------------------------------------- |
| `--red-600`  | `#C3272E`           | Brand red: the mark, primary CTAs, key accents, active states. Keep to roughly 5–10% of any screen. |
| `--red-700`  | `#A11F25`           | Hover/pressed for red.                                                                              |
| `--red-50`   | `#FBEDEE`           | Soft callout backgrounds.                                                                           |
| `--ink-900`  | `#050708`           | Headings, logo ink.                                                                                 |
| `--ink-700`  | `#2B3439`           | Body text.                                                                                          |
| `--ink-500`  | `#5F6B72`           | Secondary text (verify ≥ 4.5:1 on its backgrounds).                                                 |
| `--line`     | `rgb(5 7 8 / 0.12)` | Hairline rules and borders.                                                                         |
| `--paper`    | `#FFFFFF`           | Main surface.                                                                                       |
| `--paper-2`  | `#F7F7F5`           | Alternate section surface.                                                                          |
| `--navy-900` | `#052C40`           | Deepest navy (footer, overlays).                                                                    |
| `--navy-800` | `#0B3246`           | Primary dark surface (hero, feature bands).                                                         |
| `--blue-700` | `#024A70`           | Secondary blue for duotone photography and subtle gradients within navy bands.                      |

Contrast rule: red on navy is **decorative only** (it fails text contrast). On navy, text is white or `rgb(255 255 255 / 0.78)`; red appears only as the mark, rules, and non-text accents.

**Typography.**

- Brand fonts are **Janna LT** (Arabic) and **Poppins** (Latin). Load Poppins with `next/font/google`. Janna LT is a commercial font: support it via `next/font/local` from `/public/fonts/janna/` once licensed webfont files are supplied; until then use **IBM Plex Sans Arabic** as the stand-in. The swap must be a single-variable change. Add "confirm Janna LT webfont license" to `TODO.md`.
- Font stack: Poppins first, then the Arabic face (`font-family: var(--font-latin), var(--font-arabic), system-ui, sans-serif`), so Latin characters and digits render in Poppins and Arabic falls through to the Arabic face — in both locales.
- Arabic needs room: body 17–18px with line-height 1.8; headings bold with line-height ~1.35. English body 16–17px, line-height 1.65. Measure: 60–72 characters.
- **Never apply letter-spacing or text-transform to Arabic** (it breaks letter joining). Tracked uppercase labels are allowed only for Latin eyebrow text.
- Use Western digits (0–9), consistent with the brand posts.
- A fluid, restrained type scale (≈1.25 ratio), defined as tokens and used everywhere.

**Layout.** 12-column grid, max content width 1200px (reading pages narrower), 24px gutters, 4px spacing base. Section rhythm: 128px vertical padding on desktop, 72px on mobile. Align to the start edge; center only hero and closing CTA content.

**Signature motifs** (each drawn from the references — use them as a system, not everywhere):

1. _The red rule_ — a short 48×3px red bar at the start edge beneath section headings (as in the plan document and the brand posts' red underline under speaker names).
2. _Ordinal section labels_ — small labels in the manner of the plan document: «أولًا · ثانيًا · ثالثًا…» / "01 · 02 · 03" in English.
3. _The mark as accent_ — the red inverted-triangle "A" from `mark.svg`, used for the current timeline station, list bullets in key places, active nav indicator, and a small corner notch on featured cards (at the top **start** corner, mirroring the red corner triangle in the posts). Never distort it; never recolor it except white on red.
4. _Keffiyeh texture_ — build an original, geometric keffiyeh-net SVG pattern tile; use it at 4–6% opacity on `--paper-2` sections and 6–8% white-on-navy in dark bands. Never behind body text at readable-interfering contrast.
5. _Navy duotone photography_ — all photos are treated to navy/blue duotone (as in the brand posts), so imagery stays coherent regardless of source. Implement as a reusable image component (CSS blend/filter or pre-processing), with an untreated option for the Camp gallery.
6. _Accent word_ — in select display headings, one key word may be set in red (as «فلسطين» and «جيل الطوفان» are in the posts), controlled by an editor-friendly markup (e.g. `**word**` → accent) in hero/section titles only.

**Components** (build each once, document it, reuse it): Button (primary red, secondary ink-outline, ghost; rectangular with 2px radius — the brand is angular, so no pills), Link with an underline that grows on hover, SectionHeading (ordinal + title + red rule + optional intro), ProgramCard, SessionRow, DateBlock, InstructorCard, EventCard, Timeline, Accordion, Tabs, Callout (red-50 box, as in the plan document), Breadcrumbs, LanguageSwitch, Badge (registration status), Gallery/Lightbox, Pattern backgrounds, DuotoneImage, Form fields (label above, 1px border, focus in ink with a red focus ring), EmptyState, Toast.

**Motion.** Minimal and purposeful: 150–250ms ease-out for hovers and disclosure; content fades up 8px once on first view. No parallax, no scroll-jacking, no auto-playing carousels. Respect `prefers-reduced-motion` fully.

**Styleguide route.** Build `/[locale]/styleguide` (disabled in production) showing tokens, type scale, every component in each state, in both directions. This is how I will review pixel precision.

**References.** Borrow _structure_, not _style_, from:

- `academia.sharqforum.org/en` — course/program cards, instructor strip, benefits row, partners, rich footer with explore/quick-links/contact columns.
- `iwyouthacademy.org` — Arabic-first leadership-academy framing with Palestine at the center.
  Our visual language comes from our own brand (§8), and it should feel calmer and more editorial than both.

## 9. Internationalization and RTL rules

- `<html lang dir>` set per locale; Arabic is `dir="rtl"`.
- Every UI string lives in `messages/ar.json` and `messages/en.json` — no hard-coded copy in components.
- Directional icons (arrows, chevrons) mirror in RTL; logos, the mark, media controls, and numerals do not.
- The language switch keeps the visitor on the equivalent page (and slug) in the other locale; if a translation is missing, show the Arabic content with a small notice rather than a 404.
- Emit `hreflang` alternates for every page.
- Adding a locale later must require only config and a messages file.

## 10. Live sessions, time, and registration logic

- **Time zones:** store `startsAt` in UTC. Display the primary time in the academy time zone labeled «بتوقيت القدس» / "Al-Quds time" (default IANA zone `Asia/Hebron`, configurable in SiteSettings), plus the visitor's local time computed on the client with `Intl`. Format dates per locale.
- **Join-link visibility** (SiteSettings, default `window`): `always` shows links publicly; `window` renders the join button only from 30 minutes before start until the session ends — enforce this **server-side** (the URL is not in the page before the window); `email-only` never shows links and tells visitors links are sent to registered participants. Render the schedule dynamically (or with short revalidation) so the window is accurate.
- **Add to calendar:** per-session `.ics` download and a Google Calendar link.
- **Session states:** upcoming, starting soon, live now, completed, cancelled — each with clear, accessible styling.
- **Registration modes** per program as in §7. On submit: save the Application, send the applicant a localized confirmation email, and notify the academy's contact email. Rate-limit and honeypot every public form.

## 11. Admin (Payload) experience

Editors are not developers. Make the admin calm and obvious: Arabic admin UI, collections grouped (Academy · Programs · Knowledge · Events · Submissions · Settings), helpful field descriptions in Arabic, sensible default columns in list views, live preview links to the public page, image focal-point support, and Applications filterable by program and status with CSV export. Access control: public reads only published documents; Applications and Contact messages are never publicly readable.

## 12. Quality bars

- **Accessibility:** WCAG 2.2 AA. Semantic landmarks, skip link, visible focus (2px red ring with offset), keyboard-complete accordion, menu, and lightbox, form errors announced, alt text required on media uploads. Zero serious/critical axe violations.
- **Performance:** Lighthouse mobile ≥ 95 for Performance, Accessibility, Best Practices, and SEO on Home and a Program page. `next/image` with AVIF/WebP, subset fonts, no heavy animation libraries, minimal client JS.
- **SEO:** localized `generateMetadata` everywhere, canonical URLs on `jilaltufan.com`, `sitemap.xml` (both locales), `robots.txt`, JSON-LD (`EducationalOrganization` sitewide, `Course` on program pages, `Event` on sessions/events), and dynamic OG images via `next/og` using a brand template (navy field, white lockup, red mark, title) that echoes the social posts.
- **Security & privacy:** secrets only in env (provide `.env.example`), security headers including a sensible CSP, server-side validation everywhere, minimal PII, and a privacy page explaining what applications collect and why.

## 13. Seed content

Write an idempotent seed script: all six programs with their real names (AR/EN) and placeholder descriptions; eight monthly placeholder sessions per program from September to April of the current season (flagged `isPlaceholder`); the Camp as an event; the About page with the real mission text above; a placeholder SiteSettings. No invented people: instructors are seeded as clearly labeled placeholders («[اسم المحاضر]»), without photos.

## 14. Milestones (each ends with the checklist in §0.2)

- **M0 — Plan:** read `_context/`, write `PLAN.md`, `CLAUDE.md`, `TODO.md`. Wait for approval.
- **M1 — Foundation:** scaffold Next.js + Payload + Postgres (Docker Compose), locales and routing, design tokens, fonts, header/footer shell, styleguide route with base components.
- **M2 — Content model:** collections, globals, access control, admin grouping, seed script.
- **M3 — Core pages:** Home, About, Structure, Programs index, Program page template.
- **M4 — Time-based features:** Sessions, Schedule, join-window logic with unit tests, calendar exports, Events and the Camp page, Projects.
- **M5 — Registration:** Apply flow, emails, admin workflow, anti-spam.
- **M6 — Windows & knowledge:** Student window, Instructor window and profiles, Knowledge hub (Minbar, Materials), Contact, legal pages, 404.
- **M7 — Hardening:** accessibility pass, performance pass, SEO, full Playwright suite, `README.md` (local setup in under 5 minutes), `DEPLOY.md`, final `TODO.md` of open content items.

## 15. Open decisions — implement these defaults, keep them configurable

From the plan's «ما نحتاج إلى تحديده الآن»:

1. _Programs at launch:_ seed all six; each can be hidden via `status`.
2. _Content per program:_ the template supports every field; empty fields hide cleanly.
3. _Open vs. application-based registration:_ per-program `registrationMode`, default `application`.
4. _Student/instructor accounts:_ not in the MVP; the Users model and route structure are ready for Phase 2.
5. _Content and file volume in year one:_ storage adapter via env; 20 MB upload limit; PDFs and images only.
   Also pending from me: final English name usage, `jilaltufan.com`, `contact@jilaltufan.com`, social links, Janna LT license, SVG logo files, real photography. Track all of them in `TODO.md`.

## 16. Definition of done for the MVP

An editor can, without a developer, publish a program with its eight sessions and Zoom links, publish an event, receive and triage applications, and switch any page between Arabic and English — and a student on a phone can find their program, see the next session in their own time, join it at the right moment, and apply, in a site that unmistakably looks and feels like أكاديمية جيل الطوفان.

Begin with M0.
