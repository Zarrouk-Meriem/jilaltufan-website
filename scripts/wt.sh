#!/usr/bin/env bash
# One task = one worktree = one branch = one dev-server port. The main checkout only
# integrates. See CLAUDE.md → "Working flow".
#
#   scripts/wt.sh new <name>    worktree ../JAA-<name> on branch <name> from main,
#                               .env copied, deps installed, dev server on its own port
#   scripts/wt.sh list          every worktree: port, server up or not, commits ahead
#   scripts/wt.sh land <name>   rebase on main, pnpm check, fast-forward main (no push)
#   scripts/wt.sh done <name>   stop its server, remove the worktree and the branch
#   scripts/wt.sh tidy          prune stale worktrees, drop .next-prod, compact git
set -euo pipefail

MAIN="$(git -C "$(dirname "$0")/.." worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
cmd="${1:-}"
name="${2:-}"
dir="$(dirname "$MAIN")/JAA-$name"

need_name() {
  [[ -n "$name" && "$name" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "usage: $0 $cmd <name>  (lowercase, digits, dashes)"; exit 1; }
}
port_of() { cat "$1/.port" 2>/dev/null || true; }
# Uncommitted work in a worktree, new files included; only our own .port is not work.
dirty() { git -C "$1" status --porcelain -- . ':!.port'; }
up() { [[ -n "$1" ]] && lsof -nP -iTCP:"$1" -sTCP:LISTEN -t >/dev/null 2>&1; }

case "$cmd" in
  new)
    need_name
    [[ -e "$dir" ]] && { echo "$dir already exists"; exit 1; }
    git -C "$MAIN" worktree add -q -b "$name" "$dir" main
    cp "$MAIN/.env" "$dir/.env"
    # Uploads live on local disk (gitignored) and every worktree shares the one local
    # database, so they share its files too; without them every image answers 400.
    for d in media application-files session-files; do
      [[ -d "$MAIN/$d" ]] && ln -s "$MAIN/$d" "$dir/$d"
    done
    # 3001 is the main checkout's, 3002 the production check's; tasks take 3010+.
    port=3010
    taken=" $(for w in $(git -C "$MAIN" worktree list --porcelain | awk '/^worktree /{print $2}'); do port_of "$w"; done | tr '\n' ' ') "
    while [[ "$taken" == *" $port "* ]] || up "$port"; do port=$((port + 1)); done
    echo "$port" > "$dir/.port"
    (cd "$dir" && pnpm install --frozen-lockfile --silent && npx --no-install next typegen >/dev/null)
    (cd "$dir" && PORT="$port" scripts/dev-restart.sh --clean)
    # The throwaway staff accounts the account/activity specs sign in with: without this
    # file 43 tests skip quietly and a run looks green (twice, 2026-09-25/26). Every run of
    # the script rotates the passwords, so an older worktree's copy stops working — run it
    # again there before its next suite.
    (cd "$dir" && { pnpm payload:tsx run scripts/e2e-staff.ts >/dev/null 2>&1 || true; }
      [[ -f .e2e-staff.json ]] || pnpm payload:tsx run scripts/e2e-staff.ts >/dev/null 2>&1 || true
      [[ -f .e2e-staff.json ]] || echo "warning: .e2e-staff.json not written; run: pnpm payload:tsx run scripts/e2e-staff.ts")
    echo "ready: $dir  (branch $name, http://localhost:$port)"
    ;;

  list)
    git -C "$MAIN" worktree list --porcelain | awk '/^worktree /{w=$2} /^branch /{sub("refs/heads/","",$2); print w, $2}' |
      while read -r w b; do
        p="$(port_of "$w")"
        state="-"; [[ -n "$p" ]] && { up "$p" && state="up" || state="down"; }
        ahead="$(git -C "$MAIN" rev-list --count "main..$b" 2>/dev/null || echo 0)"
        changed="$(dirty "$w" | wc -l | tr -d ' ')"
        printf '%-44s %-24s port %-5s %-5s ahead %-3s uncommitted %s\n' "$w" "$b" "${p:--}" "$state" "$ahead" "$changed"
      done
    ;;

  land)
    need_name
    [[ -z "$(dirty "$dir")" ]] || { echo "$dir has uncommitted changes: commit them first"; exit 1; }
    [[ -z "$(dirty "$MAIN")" ]] || { echo "the main checkout has uncommitted changes: sort them out first"; exit 1; }
    git -C "$dir" rebase -q main
    # Regenerate route types first: a production check (NEXT_DIST_DIR=.next-prod) points
    # next-env.d.ts at its own folder, and once that is removed every PageProps is unknown.
    (cd "$dir" && npx --no-install next typegen >/dev/null && pnpm check)
    git -C "$MAIN" merge --ff-only -q "$name"
    echo "main is now $(git -C "$MAIN" log -1 --format='%h %s')  — not pushed"
    ;;

  done)
    need_name
    [[ -d "$dir" ]] || { echo "no worktree at $dir"; exit 1; }
    [[ -z "$(dirty "$dir")" ]] || { echo "$dir has uncommitted changes: commit or discard them first"; exit 1; }
    if [[ -n "$(git -C "$MAIN" cherry main "$name" | grep '^+' || true)" ]]; then
      echo "branch $name has commits that are not in main: land it first"; exit 1
    fi
    p="$(port_of "$dir")"
    for pid in $( [[ -n "$p" ]] && lsof -nP -iTCP:"$p" -sTCP:LISTEN -t 2>/dev/null ); do kill "$pid" 2>/dev/null || true; done
    git -C "$MAIN" worktree remove --force "$dir"  # --force: .port and build output are untracked
    git -C "$MAIN" branch -D "$name" >/dev/null   # safe: every commit is in main (checked above)
    echo "removed $dir and branch $name"
    ;;

  tidy)
    git -C "$MAIN" worktree prune
    if [[ -d "$MAIN/.next-prod" ]] && ! up 3002; then rm -rf "$MAIN/.next-prod" && echo "removed .next-prod"; fi
    git -C "$MAIN" gc --quiet && echo "git compacted ($(du -sh "$MAIN/.git" | cut -f1))"
    "$0" list
    ;;

  *)
    sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
