#!/usr/bin/env bash
# Everything that must be green before anything is reported as done.
#   PORT=3001 scripts/verify.sh
set -euo pipefail
export PORT="${PORT:-3001}" PLAYWRIGHT_NO_SERVER=1
echo "▶ pnpm check";                pnpm check
echo "▶ e2e (all specs, both locales, axe, console, hydration, overlay)"; pnpm exec playwright test --project=chromium
echo "▶ simulated Bitdefender DOM stamping"; node scripts/sim-extension.cjs
echo "▶ real Chrome extensions from the local profile"; node scripts/real-extensions.cjs
# Opt-in: the reproducer's abrupt tear-downs can leave the dev module graph stale (restart dev
# afterwards), so point it at a production server: pnpm build && PORT=3002 pnpm start.
if [[ -n "${WEDGE_URL:-}" ]]; then
  echo "▶ image optimizer survives dropped connections (patched next) @ $WEDGE_URL"; node scripts/image-wedge.cjs "$WEDGE_URL"
else
  echo "▷ skipped image-wedge (set WEDGE_URL=http://localhost:3002 with a production server running)"
fi
echo "✔ verify: all green"
