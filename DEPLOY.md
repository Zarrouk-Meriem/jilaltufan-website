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

Fits the ≈ $25/month target with room to spare. E.g. Hetzner CX22 (2 vCPU, 4 GB) ≈ €4–5, Cloudflare in front for TLS/CDN (free), R2 for media (free tier covers this volume), Resend free tier for < 3,000 emails/month.

```bash
# on the server
docker compose -f docker-compose.prod.yml up -d      # app + postgres + a volume
docker compose exec app pnpm migrate && docker compose exec app pnpm seed
```

`docker-compose.prod.yml` is not written yet (deploy-time task); the `Dockerfile` builds the standalone image (`DOCKER_BUILD=1`). Put Caddy or Cloudflare Tunnel in front for HTTPS. Back up Postgres nightly (`pg_dump` to R2) — a one-line cron.

## Path B — Vercel long-term (not planned)

Staying on Vercel past the preview would mean Vercel Pro: Vercel Pro is $20/seat/month (Hobby excludes commercial use), plus Neon/Supabase for Postgres (free tiers exist) and R2 for media (required — no persistent disk). Serverless cold starts also make Payload's admin feel slower than on a VPS.

- Set all env vars in the project; `DOCKER_BUILD` unset.
- Build command `pnpm build`; add `pnpm migrate` to the build step or run it from a one-off job.
- ISR and route handlers work unchanged; the OG route runs on the Node runtime.

## The Next patch

`patches/next@16.3.5.patch` is applied by `pnpm install` (the Dockerfile copies `patches/` before installing). It fixes an image-optimizer hang that would otherwise leave individual image variants broken for every visitor until the process restarts. Do not deploy an unpatched Next — see CLAUDE.md and TODO.md.

## Security headers

`src/proxy.ts` sets the CSP (scripts pinned to our origin; inline allowed because the public pages are ISR/SSG and a per-request nonce cannot match cached HTML), HSTS (production only), and the static headers in `next.config.ts`. `/admin` and `/api` are excluded (Payload sets its own). If Turnstile is enabled, its domain is allowed automatically.

Lighthouse (mobile, production build, M7): Home 94 / 100 / 100 / 100, program page 94 / 100 / 100 / 100 (performance / accessibility / best practices / SEO). The performance points are the framework runtime plus eight preloaded font files; see TODO.md for the one remaining lever.

## Rate limiting

In-process token buckets per hashed IP (5 applications / 10 min, 3 contact messages / 10 min). Correct for a single instance. If you ever run more than one instance, back the buckets with Redis/KV — the interface in `src/lib/forms/rate-limit.ts` is the only thing to swap.
