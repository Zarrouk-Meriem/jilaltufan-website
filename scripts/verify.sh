#!/usr/bin/env bash
# Everything that must be green before anything is reported as done.
#   PORT=3001 scripts/verify.sh
set -euo pipefail
export PORT="${PORT:-3001}" PLAYWRIGHT_NO_SERVER=1
echo "▶ pnpm check";                pnpm check
echo "▶ e2e (all specs, both locales, axe, console, hydration, overlay)"; pnpm exec playwright test --project=chromium
echo "▶ simulated Bitdefender DOM stamping"; node scripts/sim-extension.cjs
echo "▶ real Chrome extensions from the local profile"; node scripts/real-extensions.cjs
echo "✔ verify: all green"
