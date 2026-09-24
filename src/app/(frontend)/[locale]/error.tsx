'use client'

import { useLocale, useTranslations } from 'next-intl'
import { ErrorState } from '@/components/layout/ErrorState'

/**
 * A page that failed to render, inside the site's own frame (header and footer stay).
 * The layout above it is not covered here — `src/app/global-error.tsx` catches that.
 */
export default function PageError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const t = useTranslations('error')
  const locale = useLocale()
  return (
    <ErrorState
      copy={{
        title: t('title'),
        body: t('body'),
        retry: t('retry'),
        home: t('home'),
        reference: error.digest ? t('reference', { digest: error.digest }) : undefined,
      }}
      homeHref={`/${locale}`}
      onRetry={retry}
    />
  )
}
