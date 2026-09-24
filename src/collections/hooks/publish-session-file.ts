import type { CollectionAfterChangeHook } from 'payload'
import { SKIP_ACTIVITY } from '@/lib/payload/activity'
import type { SessionFile } from '@/payload-types'

/** Set on the hook's own follow-up write (clearing the box, recording the result). */
const PUBLISHING = 'publishingSessionFile'

const idOf = (v: unknown): number | null =>
  typeof v === 'number'
    ? v
    : typeof v === 'object' && v && 'id' in v
      ? Number((v as { id: unknown }).id)
      : null

/**
 * «انشره مادةً للطلبة»: one step from an instructor's PDF to a published material of that
 * session and its program. The material points at the file where it is (Materials →
 * `sessionFile`), and the file's review becomes «نُشر», which is also what lets students
 * download it (SessionFiles read access). Named after the file in both languages; staff
 * rename it on the material if they like. A non-PDF never gets here (the box is hidden),
 * and a file already published is not published twice.
 */
export const publishAsMaterial: CollectionAfterChangeHook<SessionFile> = async ({
  doc,
  req,
  context,
}) => {
  if (context[PUBLISHING] || !doc.publish) return doc
  const payload = req.payload
  const clear = (data: Partial<SessionFile>) =>
    payload.update({
      collection: 'session-files',
      id: doc.id,
      data: { publish: false, ...data },
      overrideAccess: true,
      req,
      context: { [PUBLISHING]: true, [SKIP_ACTIVITY]: true },
    })

  if (doc.mimeType !== 'application/pdf' || doc.material) {
    await clear({})
    return { ...doc, publish: false }
  }

  const sessionId = idOf(doc.session)
  const session = sessionId
    ? await payload
        .findByID({ collection: 'sessions', id: sessionId, depth: 0, overrideAccess: true, req })
        .catch(() => null)
    : null
  const title = (doc.originalName || doc.filename || '').replace(/\.pdf$/i, '').trim() || '—'

  const material = await payload.create({
    collection: 'materials',
    locale: 'ar',
    data: {
      title,
      type: 'pdf',
      sessionFile: doc.id,
      program: idOf(session?.program) ?? undefined,
      session: sessionId ?? undefined,
      status: 'published',
      isPlaceholder: false,
    },
    overrideAccess: true,
    req,
  })
  await payload.update({
    collection: 'materials',
    id: material.id,
    locale: 'en',
    data: { title },
    overrideAccess: true,
    req,
  })
  await clear({ review: 'published', material: material.id })
  return { ...doc, publish: false, review: 'published', material: material.id }
}
