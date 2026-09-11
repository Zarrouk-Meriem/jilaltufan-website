import { getTranslations } from 'next-intl/server'
import { Mark } from '@/components/brand/Mark'
import { ButtonLink } from '@/components/ui/Button'

export default async function NotFound() {
  const t = await getTranslations('notFound')
  return (
    <section className="container-reading flex flex-col items-start section-y">
      <Mark size={40} />
      <h1 className="mt-8 text-3xl">{t('title')}</h1>
      <p className="mt-4 measure text-md text-ink-500">{t('body')}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/programs">{t('programs')}</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          {t('home')}
        </ButtonLink>
      </div>
    </section>
  )
}
