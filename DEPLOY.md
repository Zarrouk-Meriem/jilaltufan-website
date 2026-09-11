# Deploying

Nothing is deployed in this phase. This documents both supported paths so the choice can be made at launch.

## What the app needs

|                                                           | Required   | Notes                                                                                                                                                |
| --------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                            | yes        | Postgres 15+. One database.                                                                                                                          |
| `PAYLOAD_SECRET`                                          | yes        | ≥ 32 random chars. Rotating it logs every editor out.                                                                                                |
| `NEXT_PUBLIC_SITE_URL`                                    | yes        | `https://jilaltufan.com` — canonicals, sitemap, emails, OG images use it.                                                                            |
| `S3_*`                                                    | production | Media storage. Cloudflare R2 works and has no egress fees. Without these, uploads go to the local disk — fine on a VPS with a volume, not on Vercel. |
| `EMAIL_PROVIDER` + keys                                   | production | `resend` or `smtp`. Without it, emails are logged to the console (applicants get nothing).                                                           |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | optional   | Cloudflare Turnstile on the forms. Inert when unset.                                                                                                 |

Migrations: `pnpm migrate` runs `src/migrations` against `DATABASE_URL`. Run it once before the first start and after every deploy that changes the content model. Then `pnpm seed` once (idempotent).

## Path A — one small VPS with Docker (recommended, ≈ $6–10 / month)

Fits the ≈ $25/month target with room to spare. E.g. Hetzner CX22 (2 vCPU, 4 GB) ≈ €4–5, Cloudflare in front for TLS/CDN (free), R2 for media (free tier covers this volume), Resend free tier for < 3,000 emails/month.

```bash
# on the server
docker compose -f docker-compose.prod.yml up -d      # app + postgres + a volume
docker compose exec app pnpm migrate && docker compose exec app pnpm seed
```

`docker-compose.prod.yml` is not written yet (deploy-time task); the `Dockerfile` builds the standalone image (`DOCKER_BUILD=1`). Put Caddy or Cloudflare Tunnel in front for HTTPS. Back up Postgres nightly (`pg_dump` to R2) — a one-line cron.

## Path B — Vercel + managed Postgres

Works, but does not fit the budget on its own: Vercel Pro is $20/seat/month (Hobby excludes commercial use), plus Neon/Supabase for Postgres (free tiers exist) and R2 for media (required — no persistent disk). Serverless cold starts also make Payload's admin feel slower than on a VPS.

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
