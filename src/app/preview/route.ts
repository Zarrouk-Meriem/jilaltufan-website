import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getClient } from '@/lib/queries/client'
import { isSitePath } from '@/lib/preview'

/**
 * The admin's live-preview pane opens `/preview?path=/ar/…`. Staff only: the sign-in cookie
 * is the admin's own, and Payload reads it from these headers. It turns on Next's draft mode
 * (this browser alone skips the page cache and reads drafts) and goes to the page — a path
 * on this site only, never an address someone else could smuggle in.
 */
export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get('path') ?? ''
  if (!isSitePath(path)) return new Response('Bad path', { status: 400 })
  const payload = await getClient()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || user.collection !== 'users') return new Response('Staff only', { status: 403 })
  ;(await draftMode()).enable()
  redirect(path)
}
