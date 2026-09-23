#!/usr/bin/env bash
# Restart the dev server safely. Requests during Turbopack's first compile after a
# .next wipe corrupt its manifests (JSON.parse "non-whitespace after JSON"), so this
# waits for the "Ready" line before anything touches the server.
#   scripts/dev-restart.sh [--clean]        (PORT defaults to 3001)
set -euo pipefail
PORT="${PORT:-3001}"   # 3000 belongs to another app on this machine
for pid in $(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null); do kill "$pid" 2>/dev/null || true; done
sleep 2
[ "${1:-}" = "--clean" ] && rm -rf .next
: > .artifacts-dev.log
(PORT="$PORT" pnpm dev > .artifacts-dev.log 2>&1 &)
for _ in $(seq 1 90); do grep -q "Ready in" .artifacts-dev.log && break; sleep 1; done
grep -q "Ready in" .artifacts-dev.log || { echo "dev server did not become ready"; exit 1; }
sleep 4
# Warm every public route one at a time: parallel first compiles (a Playwright run with
# four workers, a browser tab reconnecting) race on Turbopack's manifests and leave
# every route answering 500 with "Unexpected non-whitespace character after JSON".
# Signed-out account pages still compile their segment (they redirect), and a token that
# belongs to nobody compiles the follow-up page on its way to a 404 — which is the point:
# a route left uncompiled here is one four Playwright workers will race on later.
for r in "" /programs /programs/palestine-our-compass /apply /schedule /events /events/jeel-altoufan-camp /projects /about /about/structure /students /instructors /knowledge /knowledge/minbar /knowledge/materials /contact /privacy /terms /account /account/sign-in /account/forgot /account/set-password /account/profile /application/warm-the-route; do
  for l in ar en; do curl -s -o /dev/null "http://localhost:$PORT/$l$r"; done
done
curl -s -o /dev/null -w "http://localhost:$PORT → %{http_code}\n" "http://localhost:$PORT/ar"
