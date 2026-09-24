'use server'

import { headers } from 'next/headers'
import { mintStatusToken, statusUrl } from '@/lib/applications/status-token'
import { statusLinkEmail } from '@/lib/email/templates'
import { clientIp, statusLinkLimiter } from '@/lib/forms/rate-limit'
import { getClient } from '@/lib/queries/client'

export type ReissueResult = { status: 'idle' | 'sent' | 'error' }

/**
 * A fresh follow-up link for an expired one.
 *
 * The old token is the whole authorisation: holding it is proof the confirmation letter
 * arrived. The new link goes to the address already on the application and nowhere else —
 * this action takes no address, so there is nothing a visitor could redirect it to. The
 * answer is the same whether the token is real or invented, so the page cannot be used to
 * find out whether a token exists.
 */
export async function reissueStatusLink(token: string): Promise<ReissueResult> {
  const ip = clientIp(await headers())
  if (!statusLinkLimiter.check(ip).ok) return { status: 'error' }

  const payload = await getClient()
  try {
    const { docs } = await payload.find({
      collection: 'applications',
      where: { statusToken: { equals: token } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      select: { fullName: true, email: true, locale: true },
    })
    const doc = docs[0]
    // An unknown token gets the same answer as a real one: nothing here confirms that an
    // application exists.
    if (!doc) return { status: 'sent' }

    const minted = mintStatusToken()
    await payload.update({
      collection: 'applications',
      id: doc.id,
      data: minted,
      overrideAccess: true,
    })

    const locale = doc.locale === 'en' ? 'en' : 'ar'
    const letter = statusLinkEmail(locale, doc.fullName, statusUrl(minted.statusToken, locale))
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    await payload.sendEmail({
      to: doc.email,
      replyTo: settings.applicationsEmail || settings.contactEmail,
      subject: letter.subject,
      text: letter.text,
      html: letter.html,
    })
    return { status: 'sent' }
  } catch (err) {
    payload.logger.error({ msg: 'status link reissue failed', err })
    return { status: 'error' }
  }
}
