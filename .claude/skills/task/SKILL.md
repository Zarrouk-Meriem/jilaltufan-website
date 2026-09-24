---
name: task
description: Start, continue, or finish a piece of work on this repo the tidy way — its own worktree, branch and dev-server port (scripts/wt.sh), checks before it reaches main, cleanup after. Use at the start of every session that will change files, e.g. "/task fix the footer on mobile", "/task continue error-pages", "/task status".
---

# /task — one task, one worktree

The user runs this as the first prompt of a session. Follow the working flow in CLAUDE.md
("Working flow — one task, one worktree"): **never edit files in the main checkout**
(`/Users/meriemzarrouk/Personal/JAA`); it only receives finished work.

The request is: $ARGUMENTS

## 0. Read the request

- `status` (or nothing) → run `scripts/wt.sh list` from the main checkout, check `ListAgents`
  for other busy sessions, and report in a few bullets: open tasks, their ports, what is
  unmerged or uncommitted, and whether `main` is ahead of GitHub (`git status -sb`). Stop.
- `continue <name>` → the task already exists: work in `../JAA-<name>`. If its dev server is
  down, restart it: `PORT=$(cat .port) scripts/dev-restart.sh --clean` from that folder.
  Go to step 2.
- A question or a check that changes no file → answer it directly, no worktree. Stop.
- Anything else is new work → step 1.

## 1. Start

1. From the main checkout, run `scripts/wt.sh list` and `ListAgents`. If another session is
   busy on the same area, say so before starting.
2. Pick a short name for the task: lowercase, dashes, 2–4 words (`footer-mobile`,
   `minbar-comments`). Tell the user the name in one line.
3. `scripts/wt.sh new <name>` (about 1.5 minutes: copy, `.env`, uploads linked, deps, dev
   server on its own port).
4. From here on, every path and command is in `/Users/meriemzarrouk/Personal/JAA-<name>`.
   The dev server is `http://localhost:$(cat .port)`; open previews there, never on 3001.

## 2. Work

- Follow CLAUDE.md for everything (logical properties, tokens, both locales, motion rules,
  no invented content).
- Commit on the task branch as you go, staging only this task's paths — never `git add -A`.
- Browser (e2e) tests run against the task's own server:
  - after any source edit, restart clean first: `PORT=$(cat .port) scripts/dev-restart.sh --clean`
  - admin/account specs need staff accounts in this folder:
    `pnpm payload:tsx run scripts/e2e-staff.ts`
  - then `PORT=$(cat .port) pnpm exec playwright test --project=chromium [spec…]`

## 3. Finish

1. Run `pnpm check`, plus the e2e specs the change touches (the whole suite for anything
   shared: layout, header, forms, styles).
2. Give the user a short summary: what changed, what was tested, and the preview URL.
   Ask one question: **"Land it in main?"**
3. On yes: from the main checkout, `scripts/wt.sh land <name>` then `scripts/wt.sh done <name>`.
   Suggest archiving the session.
4. **Never push** unless the user asks in this session. After landing, say that `main` is
   ahead of GitHub and that "push" will publish it (Vercel deploys on push).

If the user stops or changes their mind, leave the worktree as it is and say so: nothing in
it is lost, and `/task continue <name>` picks it up later.
