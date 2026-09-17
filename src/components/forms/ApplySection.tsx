'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Script from 'next/script'
import { ButtonLink } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { ApplyResult } from '@/app/(frontend)/[locale]/apply/actions'
import { ApplyForm, type CountryOption } from './ApplyForm'

type Success = Extract<ApplyResult, { status: 'success' }>

/** Owns the form ↔ confirmation switch; the form itself stays a leaf. */
export function ApplySection({
  locale,
  programSlug,
  programTitle,
  mode,
  action,
  countries,
  turnstileSiteKey,
}: {
  locale: string
  programSlug: string
  programTitle: string
  mode: 'open' | 'application'
  action: (prev: ApplyResult, fd: FormData) => Promise<ApplyResult>
  countries: CountryOption[]
  turnstileSiteKey?: string
}) {
  const t = useTranslations('apply')
  const [done, setDone] = useState<Success | null>(null)

  if (done) {
    const open = done.mode === 'open'
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-brand border border-line bg-paper-2 p-8 md:p-12"
      >
        <SectionHeading
          locale={locale}
          size="md"
          title={open ? t('successOpenTitle') : t('successApplicationTitle')}
          intro={
            open
              ? t('successOpenBody', { program: programTitle, email: done.email })
              : t('successApplicationBody', { program: programTitle, email: done.email })
          }
        />
        <p className="mt-10 text-xs font-medium text-ink-500">{t('successNext')}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <ButtonLink href={`/schedule?program=${programSlug}` as never} variant="secondary">
            {t('seeSchedule')}
          </ButtonLink>
          <ButtonLink href="/students" variant="ghost">
            {t('studentWindow')}
          </ButtonLink>
          <ButtonLink href="/" variant="ghost">
            {t('backHome')}
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <>
      {turnstileSiteKey ? (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      ) : null}
      <ApplyForm
        programSlug={programSlug}
        mode={mode}
        countries={countries}
        turnstileSiteKey={turnstileSiteKey}
        action={async (prev, fd) => {
          const r = await action(prev, fd)
          if (r.status === 'success') setDone(r)
          return r
        }}
      />
    </>
  )
}
