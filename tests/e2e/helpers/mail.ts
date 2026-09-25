import { existsSync, readFileSync, statSync } from 'node:fs'

/**
 * The inbox of a test address. Mail to a reserved domain (`@example.com`, `.test`) is never
 * sent: the adapter prints it to the dev server's log with every link on a `link:` line
 * (src/lib/payload/email.ts), and `scripts/dev-restart.sh` writes that log to
 * `.artifacts-dev.log`. Reading it is how a test follows a real invite or reset link.
 */
const LOG = '.artifacts-dev.log'

export const mailLogAvailable = () => existsSync(LOG)

/** Where the log ends now: read only what arrives after this. */
export const mailMark = () => (existsSync(LOG) ? statSync(LOG).size : 0)

/**
 * The first link matching `pattern` in a letter to `to` written after `since`, waiting up to
 * `timeoutMs` for it to arrive.
 */
export async function linkIn(
  to: string,
  pattern: RegExp,
  since: number,
  timeoutMs = 15_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    // `since` is a byte offset (the file's size): cut the bytes, then decode — slicing the
    // decoded text would count characters, and every Arabic letter is two bytes.
    const fresh = readFileSync(LOG).subarray(since).toString('utf8')
    for (const block of fresh.split('── email (not sent').slice(1)) {
      if (!new RegExp(`^to:\\s+${to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(block))
        continue
      const link = [...block.matchAll(/^link:\s+(\S+)/gm)]
        .map((m) => m[1]!)
        .find((u) => pattern.test(u))
      if (link) return link.replace(/&amp;/g, '&')
    }
    if (Date.now() > deadline) throw new Error(`no letter to ${to} with a link like ${pattern}`)
    await new Promise((r) => setTimeout(r, 250))
  }
}
