import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { isSitePath } from '@/lib/preview'

/** Leaves preview: back to what every visitor sees. POST, so no prefetch can end it by accident. */
export async function POST(req: Request) {
  ;(await draftMode()).disable()
  const back = new URL(req.url).searchParams.get('path') ?? ''
  redirect(isSitePath(back) ? back : '/')
}
