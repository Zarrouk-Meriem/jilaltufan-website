import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { forgetZoomToken, meetingParticipants, ZoomError, zoomConfigured } from '@/lib/zoom/client'

/** A stub Zoom: a token endpoint and a paged report, with a record of what was asked. */
function zoomStub(pages: { participants: unknown[]; next_page_token?: string }[]) {
  const calls: string[] = []
  let tokenRequests = 0
  let page = 0
  const impl = (async (input: RequestInfo | URL) => {
    const url = String(input)
    calls.push(url)
    if (url.startsWith('https://zoom.us/oauth/token')) {
      tokenRequests += 1
      return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), {
        status: 200,
      })
    }
    const body = pages[page] ?? { participants: [] }
    page += 1
    return new Response(JSON.stringify(body), { status: 200 })
  }) as unknown as typeof fetch
  return { impl, calls, tokenRequests: () => tokenRequests }
}

const answering = (status: number) =>
  (async (input: RequestInfo | URL) =>
    String(input).startsWith('https://zoom.us/oauth/token')
      ? new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 })
      : new Response('{}', { status })) as unknown as typeof fetch

const CREDENTIALS = {
  ZOOM_ACCOUNT_ID: 'acc',
  ZOOM_CLIENT_ID: 'cid',
  ZOOM_CLIENT_SECRET: 'secret',
}

describe('the Zoom client', () => {
  beforeEach(() => {
    forgetZoomToken()
    Object.assign(process.env, CREDENTIALS)
  })
  afterEach(() => {
    for (const key of Object.keys(CREDENTIALS)) delete process.env[key as keyof typeof CREDENTIALS]
    forgetZoomToken()
  })

  it('is inert without credentials, and says so rather than failing at Zoom', async () => {
    for (const key of Object.keys(CREDENTIALS)) delete process.env[key as keyof typeof CREDENTIALS]
    expect(zoomConfigured()).toBe(false)
    await expect(meetingParticipants('123', answering(200))).rejects.toMatchObject({
      reason: 'unconfigured',
    })
  })

  it('follows the paging to the end and returns every participant', async () => {
    const stub = zoomStub([
      { participants: [{ user_email: 'a@example.org' }], next_page_token: 'p2' },
      { participants: [{ user_email: 'b@example.org' }], next_page_token: 'p3' },
      { participants: [{ user_email: 'c@example.org' }] },
    ])
    const all = await meetingParticipants('123', stub.impl)
    expect(all.map((p) => p.user_email)).toEqual([
      'a@example.org',
      'b@example.org',
      'c@example.org',
    ])
    expect(stub.calls.filter((c) => c.includes('next_page_token=p2'))).toHaveLength(1)
  })

  it('asks for one token and reuses it across pages', async () => {
    const stub = zoomStub([{ participants: [], next_page_token: 'p2' }, { participants: [] }])
    await meetingParticipants('123', stub.impl)
    expect(stub.tokenRequests()).toBe(1)
  })

  it('names the plan when Zoom refuses to report, rather than calling it an error', async () => {
    await expect(meetingParticipants('123', answering(400))).rejects.toMatchObject({
      reason: 'no-report',
    })
  })

  it('separates a meeting Zoom has never heard of from a failure', async () => {
    await expect(meetingParticipants('123', answering(404))).rejects.toMatchObject({
      reason: 'not-found',
    })
  })

  it('reports refused credentials as an auth problem', async () => {
    const impl = (async () => new Response('{}', { status: 401 })) as unknown as typeof fetch
    await expect(meetingParticipants('123', impl)).rejects.toMatchObject({ reason: 'auth' })
  })

  it('throws a ZoomError, so a caller can tell one apart from a bug', async () => {
    await expect(meetingParticipants('123', answering(500))).rejects.toBeInstanceOf(ZoomError)
  })
})
