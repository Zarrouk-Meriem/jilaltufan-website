/** Cloudflare Turnstile — inert unless both keys are set. */
export const turnstileEnabled = () =>
  !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !!process.env.TURNSTILE_SECRET_KEY

export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!turnstileEnabled()) return true
  if (!token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token,
        remoteip: ip,
      }),
    })
    const json = (await res.json()) as { success?: boolean }
    return !!json.success
  } catch {
    return false
  }
}
