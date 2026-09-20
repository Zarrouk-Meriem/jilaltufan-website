# Deploying

Nothing is deployed in this phase. This documents both supported paths so the choice can be made at launch.

## What the app needs

|                                                           | Required   | Notes                                                                                                                                                |
| --------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                            | yes        | Postgres 15+. One database.                                                                                                                          |
| `PAYLOAD_SECRET`                                          | yes        | ≥ 32 random chars. Rotating it logs every editor out.                                                                                                |
| `NEXT_PUBLIC_SITE_URL`                                    | yes        | `https://jilaltufan.org` — canonicals, sitemap, emails, OG images use it.                                                                            |
| `S3_*`                                                    | production | Media storage. Cloudflare R2 works and has no egress fees. Without these, uploads go to the local disk — fine on a VPS with a volume, not on Vercel. |
| `EMAIL_PROVIDER` + keys                                   | production | `resend` or `smtp`. Without it, emails are logged to the console (applicants get nothing).                                                           |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | optional   | Cloudflare Turnstile on the forms. Inert when unset.                                                                                                 |

Migrations: `pnpm migrate` runs `src/migrations` against `DATABASE_URL`. Run it once before the first start and after every deploy that changes the content model. Then `pnpm seed` once (idempotent).

## Path 0 — Vercel now (preview at ≈ $0 / month), VPS at launch

Decided 2026-09-12: the site goes up on Vercel's free tier first so it can be reviewed on a real URL, and moves to the VPS path below when the budget allows. Nothing in the code is host-specific; the same variables drive both. Two honest caveats: Vercel Hobby is for non-commercial personal use, so treat this as a preview, not the academy's public home; and Neon's free database sleeps after inactivity (the first request after a pause takes a second or two).

**Order matters — the build itself queries the database to prerender pages, so the database must exist and be migrated before the first Vercel build.**

1. **Neon** (free Postgres) — create a project, copy the pooled connection string; it ends in `?sslmode=require`, which `pg` honours as is.
2. **Migrate and seed from this machine** against it (never via the Vercel build). Put the URL in `.env.neon` (git-ignored) rather than on the command line, and run both in **production mode** — in dev mode Payload _pushes_ the schema on startup instead of migrating, which leaves a `dev` marker and no recorded migration:
   ```bash
   export DATABASE_URL="$(grep '^DATABASE_URL=' .env.neon | cut -d= -f2-)"
   NODE_ENV=production pnpm payload:tsx migrate   # the plain `pnpm migrate` CLI can go silent
   NODE_ENV=production pnpm seed
   ```
   Check: `payload_migrations` holds `20260911_112709_initial`, not `dev`.
   Then create the first admin at the preview's `/admin` once deployed (the first account is always admin).
3. **Cloudflare R2** — a bucket for media (Vercel has no writable disk). Create an API token with object read/write; the endpoint is `https://<account-id>.r2.cloudflarestorage.com`, region `auto`.
4. **Vercel** — import the Git repository. Framework: Next.js (auto). Node 22 (Project → Settings → General). pnpm is picked up from `packageManager`; the `patches/` directory applies during install.
5. **Environment variables** (Production):

   | Variable                                                                                                | Value                                                                                                                      |
   | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
   | `DATABASE_URL`                                                                                          | the Neon pooled URL                                                                                                        |
   | `PAYLOAD_SECRET`                                                                                        | ≥ 32 random characters                                                                                                     |
   | `NEXT_PUBLIC_SITE_URL`                                                                                  | the deployment URL, e.g. `https://jaa.vercel.app` — switch to `https://jilaltufan.org` when the domain is attached         |
   | `SITE_NOINDEX`                                                                                          | `1` while on a `*.vercel.app` URL — robots.txt and every page then say _noindex_; remove it when the real domain goes live |
   | `S3_BUCKET` `S3_REGION` `S3_ENDPOINT` `S3_ACCESS_KEY_ID` `S3_SECRET_ACCESS_KEY`                         | the R2 values (`S3_REGION=auto`)                                                                                           |
   | `EMAIL_PROVIDER` `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `EMAIL_FROM_ADDRESS` `EMAIL_FROM_NAME` | the same Zoho values as `.env` — outbound SMTP on 465 works from Vercel functions                                          |

6. Deploy. Check: `/robots.txt` says `Disallow: /`, `/ar` renders, `/admin` shows the create-first-user form, an upload lands in R2, and a "forgot password" email arrives.

First-deploy lesson (2026-09-13): the admin rendered blank on Vercel while the site worked — the import map lacked the S3 plugin's client component because it had been generated on a machine without `S3_*`. Fixed for good via `admin.dependencies` (CLAUDE.md). If an admin page is ever blank with no console error, check the function logs for `PayloadComponent not found in importMap`.

What is different on Vercel and why it is fine for a preview: the Next image-optimizer patch is irrelevant there (Vercel runs its own optimizer); the in-process rate limiter is per function instance (weaker, acceptable for a preview); Payload's admin is noticeably slower on serverless cold starts.

**Moving to the VPS later** is: build the Docker image, `pg_dump` Neon → restore on the VPS, point DNS. Media stays on R2 and email stays on Zoho, so neither moves. Half a day, no code changes.

## Path A — one small VPS with Docker (at launch, ≈ $6–10 / month)

Fits the ≈ $25/month target with room to spare. E.g. Hetzner CX22 (2 vCPU, 4 GB) ≈ €4–5, R2 for media (free tier covers this volume), Zoho for mail. Cloudflare in front is optional: Caddy in the compose file terminates HTTPS itself with Let's Encrypt.

`docker-compose.prod.yml` runs five containers: **app** (the standalone Next image, unprivileged, healthchecked on `/ar`), **postgres** 17 on a volume (not exposed), **caddy** (80/443, certificates, `www` → apex), **backup** (`pg_dump` nightly at 03:00 UTC + a tar of local uploads, kept 14 days, copied to a private R2 bucket when `BACKUP_S3_BUCKET` is set), and **tools** (profile `ops`, only for one-off jobs: migrations and the seed). Every command takes the same two flags, so define an alias on the server:

```bash
alias dc='docker compose --env-file .env.prod -f docker-compose.prod.yml'
```

**One constraint shapes the order below: `next build` prerenders pages from Payload, so building the image needs a reachable, migrated database.** The build gets it through `BUILD_DATABASE_URL`, passed as a BuildKit secret (never stored in a layer). A peak of ≈ 1 GB RAM measured on 2026-09-20 means a 4 GB VPS can build the image itself; the steps below do that. Building on the laptop instead (against the local dev database, `postgresql://jaa:jaa@host.docker.internal:5432/jaa`) works the same way, but the laptop is arm64 and the VPS amd64, so add `--platform linux/amd64` and push to a registry (`APP_IMAGE=` in `.env.prod`) — slower under emulation, only worth it if the server is too small to build.

1. **Server:** Ubuntu LTS, Docker Engine + Compose plugin (`curl -fsSL https://get.docker.com | sh`), a non-root user in the `docker` group, a firewall allowing 22/80/443. Point `jilaltufan.org` and `www` A/AAAA records at it (Caddy needs this before it can get a certificate; until then set `SITE_DOMAIN=<server-ip>.sslip.io` or accept certificate errors).
2. **Checkout + env:** `git clone` the repository, `cp .env.prod.example .env.prod`, fill it in (`POSTGRES_PASSWORD` and `PAYLOAD_SECRET` from `openssl rand -hex 32`; the R2 and Zoho values are the same ones the preview uses). The file is git-ignored and is read both by Compose and by the containers.
3. **Database first:** `dc up -d postgres`, then migrate it with the tools image (built from the source checkout, no database needed to build it):
   ```bash
   dc --profile ops build tools
   dc run --rm tools                                       # pnpm payload:tsx migrate
   dc run --rm tools pnpm payload:tsx run src/seed/index.ts  # once; idempotent
   ```
   Moving from the Vercel preview instead of seeding: `pg_dump --format=custom` Neon from the laptop and `dc exec -T postgres pg_restore -U jaa -d jaa --no-owner < file.dump` (then no seed). Media stays on R2 and mail on Zoho, so neither moves.
4. **Build the app image against that database.** The compose build uses host networking, so publish Postgres on localhost for the duration of the build:
   ```bash
   docker run --rm -d --name pgtunnel --network jaa-prod_default -p 127.0.0.1:5432:5432 alpine/socat TCP-LISTEN:5432,fork,reuseaddr TCP:postgres:5432
   BUILD_DATABASE_URL="postgresql://jaa:<POSTGRES_PASSWORD>@127.0.0.1:5432/jaa" dc build app backup
   docker rm -f pgtunnel
   ```
   The URL is a BuildKit secret that Compose reads from the shell environment (not from `.env.prod`), so it goes on the command line of the build and nowhere else.
5. **Up:** `dc up -d`. Caddy fetches the certificate within a minute. Check: `https://jilaltufan.org/ar` renders, `/admin` shows the create-first-user form (the first account is always admin; if the database came from Neon, log in with the existing account), `/robots.txt` does **not** say `Disallow: /` (no `SITE_NOINDEX`), an upload lands in R2, a forgot-password email arrives, and `dc ps` shows `app` healthy.
6. **Backups:** `dc run --rm -e BACKUP_NOW=1 backup` writes one immediately — confirm the file is in the `backups` volume (`dc exec backup ls -l /backups`) and, if `BACKUP_S3_BUCKET` is set, in the bucket. Restore drill: `dc exec -T postgres pg_restore -U jaa -d jaa --clean --no-owner < db-<stamp>.dump`.

**Redeploying a new version** is the same loop: `git pull`, `dc --profile ops build tools && dc run --rm tools` (only needed when `src/migrations` changed, harmless otherwise), then step 4's build and `dc up -d app` — Compose swaps the container; a few seconds of downtime, no data touched. Migrations are run by hand, before the build, never by the container on start.

**What runs where after launch:** the site on the VPS, media on R2, mail through Zoho, DNS at the registrar (or Cloudflare). Delete the Vercel project and the Neon database once the VPS has served a week without incident, or keep Vercel as a staging preview with `SITE_NOINDEX=1`.

## Path B — Vercel long-term (not planned)

Staying on Vercel past the preview would mean Vercel Pro: Vercel Pro is $20/seat/month (Hobby excludes commercial use), plus Neon/Supabase for Postgres (free tiers exist) and R2 for media (required — no persistent disk). Serverless cold starts also make Payload's admin feel slower than on a VPS.

- Set all env vars in the project; `DOCKER_BUILD` unset.
- Build command `pnpm build`; add `pnpm migrate` to the build step or run it from a one-off job.
- ISR and route handlers work unchanged; the OG route runs on the Node runtime.

## The Next patch

`patches/next@16.3.5.patch` is applied by `pnpm install` (the Dockerfile copies `patches/` before installing; the image build fails loudly if the patch no longer applies). It fixes an image-optimizer hang that would otherwise leave individual image variants broken for every visitor until the process restarts. Do not deploy an unpatched Next — see CLAUDE.md and TODO.md.

## Security headers

`src/proxy.ts` sets the CSP (scripts pinned to our origin; inline allowed because the public pages are ISR/SSG and a per-request nonce cannot match cached HTML), HSTS (production only), and the static headers in `next.config.ts`. `/admin` and `/api` are excluded (Payload sets its own). If Turnstile is enabled, its domain is allowed automatically.

Lighthouse (mobile, production build, M7): Home 94 / 100 / 100 / 100, program page 94 / 100 / 100 / 100 (performance / accessibility / best practices / SEO). Re-measured 2026-09-20 after the Noto Kufi swap: 90 / 100 / 100 / 100 on both, median of three runs; TODO.md has the two causes (index pages rendering dynamically, and the 124 kB font) and the measured levers. Re-measure with `NEXT_DIST_DIR=.next-prod NEXT_PUBLIC_SITE_URL=http://localhost:3002 pnpm build`, `PORT=3002 pnpm start`, then `npx lighthouse http://localhost:3002/ar --preset=perf --form-factor=mobile --screenEmulation.mobile` (the site URL must match the port or the canonical audit fails).

## Rate limiting

In-process token buckets per hashed IP (5 applications / 10 min, 3 contact messages / 10 min). Correct for a single instance. If you ever run more than one instance, back the buckets with Redis/KV — the interface in `src/lib/forms/rate-limit.ts` is the only thing to swap.
