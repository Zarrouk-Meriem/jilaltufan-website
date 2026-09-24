import { getLocale, getTranslations } from 'next-intl/server'
import { Mark } from '@/components/brand/Mark'
import { PortalShell } from '@/components/portal/PortalShell'
import { ButtonLink } from '@/components/ui/Button'
import type { Locale } from '@/i18n/routing'

/**
 * A page that does not exist, inside the portal's own frame — an unknown follow-up token
 * lands here, not on Next's bare default. Two ways out: the window, or the academy's site.
 */
export default async function PortalNotFound() {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations('notFound')
  return (
    <PortalShell locale={locale}>
      <section className="flex flex-col items-start">
        <Mark size={40} />
        <h1 className="mt-8 text-3xl">{t('title')}</h1>
        <p className="mt-4 measure text-md text-ink-500">{t('body')}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/account">{t('window')}</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            {t('home')}
          </ButtonLink>
        </div>
      </section>
    </PortalShell>
  )
}
