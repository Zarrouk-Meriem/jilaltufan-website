import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing, type Locale } from '@/i18n/routing'
import { buildIcs } from '@/lib/calendar'
import { getSessionById } from '@/lib/queries'
import { rel } from '@/lib/relations'
import { SITE_DOMAIN, SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

/** /{locale}/sessions/{id}/calendar.ics — one VEVENT, no Zoom link inside (policy applies). */
export async function GET(_req: Request, ctx: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await ctx.params
  if (!hasLocale(routing.locales, locale)) return new Response('Not found', { status: 404 })
  const session = await getSessionById(locale as Locale, Number(id))
  if (!session) return new Response('Not found', { status: 404 })
  const t = await getTranslations({ locale, namespace: 'session' })
  const program = rel(session.program)
  const start = new Date(session.startsAt)
  const end = new Date(start.getTime() + (session.durationMinutes ?? 90) * 60_000)
  const ics = buildIcs({
    uid: `session-${session.id}@${SITE_DOMAIN}`,
    title: program ? `${program.title} — ${session.title}` : session.title,
    description: t('calendarDescription', { program: program?.title ?? '' }),
    location: t('calendarLocation'),
    url: program
      ? `${SITE_URL}/${locale}/programs/${program.slug}#session-${session.number}`
      : undefined,
    start,
    end,
  })
  return new Response(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="session-${session.id}.ics"`,
      'cache-control': 'no-store',
    },
  })
}
