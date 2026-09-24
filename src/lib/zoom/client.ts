import type { ZoomParticipant } from './reconcile'

/**
 * Zoom's Server-to-Server OAuth app, and the one report we read from it.
 *
 * Inert without credentials, in the same way Turnstile is: the button says the academy has
 * not connected Zoom yet rather than failing at it. The reports endpoint needs a plan that
 * includes reporting (Pro and above) — a free account answers 400 to it however correct the
 * credentials are, which is a thing to recognise rather than a bug to hunt.
 */
export const zoomConfigured = () =>
  !!process.env.ZOOM_ACCOUNT_ID && !!process.env.ZOOM_CLIENT_ID && !!process.env.ZOOM_CLIENT_SECRET

export class ZoomError extends Error {
  constructor(
    message: string,
    readonly reason: 'unconfigured' | 'auth' | 'not-found' | 'no-report' | 'http',
  ) {
    super(message)
    this.name = 'ZoomError'
  }
}

type Token = { value: string; expiresAt: number }
let cached: Token | null = null

/**
 * An account-credentials token, kept until a minute before it expires. Zoom rate-limits
 * token requests, and a sync run asks for several pages of one report.
 */
async function accessToken(fetchImpl: typeof fetch = fetch): Promise<string> {
  if (!zoomConfigured()) throw new ZoomError('Zoom is not connected', 'unconfigured')
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const basic = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`,
  ).toString('base64')
  const res = await fetchImpl(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(
      process.env.ZOOM_ACCOUNT_ID!,
    )}`,
    { method: 'POST', headers: { Authorization: `Basic ${basic}` } },
  )
  if (!res.ok) throw new ZoomError(`Zoom refused the credentials (${res.status})`, 'auth')
  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) throw new ZoomError('Zoom returned no token', 'auth')

  cached = {
    value: json.access_token,
    expiresAt: Date.now() + Math.max(0, (json.expires_in ?? 3600) - 60) * 1000,
  }
  return cached.value
}

/** Forget the cached token — for tests, and for a credentials change without a restart. */
export const forgetZoomToken = () => {
  cached = null
}

/**
 * Every participant of one meeting, following Zoom's paging to the end.
 *
 * A meeting id is the numeric id of the *occurrence*; a recurring meeting's id returns its
 * most recent one, which is why a session stores the id of the meeting it actually used.
 */
export async function meetingParticipants(
  meetingId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ZoomParticipant[]> {
  const token = await accessToken(fetchImpl)
  const out: ZoomParticipant[] = []
  let pageToken = ''

  do {
    const url = new URL(
      `https://api.zoom.us/v2/report/meetings/${encodeURIComponent(meetingId)}/participants`,
    )
    url.searchParams.set('page_size', '300')
    if (pageToken) url.searchParams.set('next_page_token', pageToken)

    const res = await fetchImpl(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 404) throw new ZoomError('Zoom has no record of that meeting', 'not-found')
    if (res.status === 400)
      throw new ZoomError(
        'Zoom will not report on this meeting — the account’s plan may not include reports',
        'no-report',
      )
    if (!res.ok) throw new ZoomError(`Zoom answered ${res.status}`, 'http')

    const json = (await res.json()) as {
      participants?: ZoomParticipant[]
      next_page_token?: string
    }
    out.push(...(json.participants ?? []))
    pageToken = json.next_page_token ?? ''
  } while (pageToken)

  return out
}
