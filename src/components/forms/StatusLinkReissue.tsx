'use client'

import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { Callout } from '@/components/ui/Callout'
import { Loader } from '@/components/ui/Loader'
import type { ReissueResult } from '@/app/(frontend)/[locale]/application/[token]/actions'

/**
 * The expired follow-up link, and the one button that fixes it. The message replaces the
 * button in a slot that is already the taller of the two, so nothing below it moves when
 * the answer arrives (Motion rules: nothing appears abruptly, nothing jumps).
 */
export function StatusLinkReissue({
  token,
  action,
}: {
  token: string
  action: (token: string) => Promise<ReissueResult>
}) {
  const t = useTranslations('application.expired')
  const [state, submit, pending] = useActionState<ReissueResult>(async () => action(token), {
    status: 'idle',
  } as ReissueResult)

  return (
    <Callout title={t('title')} className="mt-8">
      <p>{t('body')}</p>
      <div className="mt-4 min-h-11">
        {state.status === 'idle' ? (
          <form action={submit}>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader size="sm" tone="white" />
                  {t('sending')}
                </span>
              ) : (
                t('action')
              )}
            </Button>
          </form>
        ) : (
          <p
            role="status"
            className={
              state.status === 'sent' ? 'enter font-medium text-ink-900' : 'enter text-error-700'
            }
          >
            {state.status === 'sent' ? t('sent') : t('error')}
          </p>
        )}
      </div>
    </Callout>
  )
}
