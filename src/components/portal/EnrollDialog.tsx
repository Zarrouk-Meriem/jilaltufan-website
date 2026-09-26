'use client'

import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useId, useRef, useState } from 'react'
import type { FormState } from '@/app/(portal)/[locale]/account/actions'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Field'
import { Loader } from '@/components/ui/Loader'
import { cn } from '@/lib/cn'

const idle: FormState = { status: 'idle' }

/**
 * «التسجيل مجانًا» and the confirmation it opens: what the student is enrolling in, the
 * terms (a marked placeholder until the academy supplies them), and a box they must tick
 * before «أؤكّد التسجيل» does anything. The server checks all of it again.
 *
 * A native `<dialog>` opened with `showModal()`: the browser traps focus inside it, makes
 * the page behind inert, closes it on Escape and gives focus back to the button — the
 * parts a hand-built modal gets wrong. Unlike a native select it draws nothing of its own,
 * so it is styled entirely by us. It fades in with a small lift (`starting:`), and keeps
 * only the fade under reduced motion.
 */
export function EnrollDialog({
  program,
  directed,
  action,
}: {
  program: string
  directed: boolean
  action: (prev: FormState, fd: FormData) => Promise<FormState>
}) {
  const t = useTranslations('account.programs')
  const dialog = useRef<HTMLDialogElement>(null)
  const [agreed, setAgreed] = useState(false)
  const [state, submit, pending] = useActionState(action, idle)
  const formError = state.status === 'error' ? state.formError : undefined
  const serverError = formError && formError !== 'mustAgree' ? formError : undefined
  const titleId = useId()
  const agreeId = useId()

  const open = () => {
    setAgreed(false)
    dialog.current?.showModal()
    document.documentElement.style.overflow = 'hidden'
  }
  const close = () => dialog.current?.close()

  // The page scrolls again however the dialog closed (button, Escape, or leaving).
  useEffect(() => {
    const d = dialog.current
    const release = () => (document.documentElement.style.overflow = '')
    d?.addEventListener('close', release)
    return () => {
      d?.removeEventListener('close', release)
      release()
    }
  }, [])

  return (
    <>
      <Button onClick={open}>{t('enroll')}</Button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-brand border border-line bg-paper p-0 text-ink-900 opacity-0 transition-[opacity,translate,display,overlay] transition-discrete duration-200 ease-out not-open:translate-y-2 backdrop:bg-navy-900/55 backdrop:opacity-0 backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-200 open:translate-y-0 open:opacity-100 open:backdrop:opacity-100 motion-reduce:translate-y-0 starting:open:translate-y-2 starting:open:opacity-0 starting:open:backdrop:opacity-0 motion-reduce:starting:open:translate-y-0"
      >
        <form action={submit} className="flex flex-col gap-5 p-6 md:p-8">
          <h2 id={titleId} className="text-xl">
            {t('dialog.title')}
          </h2>
          <p className="measure text-base text-ink-700">{t('dialog.lead', { program })}</p>
          {directed ? (
            <p className="measure border-s-2 border-red-600 ps-4 text-sm text-ink-700">
              {t('dialog.directedNote')}
            </p>
          ) : null}

          <section className="rounded-brand border border-line bg-paper-2 p-4">
            <h3 className="text-sm font-semibold text-ink-900">{t('dialog.termsTitle')}</h3>
            <p className="mt-2 max-h-40 overflow-y-auto text-sm text-ink-700">
              {t('dialog.terms')}
            </p>
          </section>

          {/* «Tick the box» belongs to the box, on its own reserved line. Anything the
              server says opens its line by height (collapse-y), so nothing jumps and no gap
              is reserved for an error that usually never comes. */}
          <div className="flex flex-col gap-1">
            <Checkbox
              id={agreeId}
              name="agree"
              required
              label={t('dialog.agree')}
              checked={agreed}
              onChange={(e) => setAgreed(e.currentTarget.checked)}
              error={formError === 'mustAgree' ? t('errors.mustAgree') : undefined}
            />
            <div
              className={cn('collapse-y', serverError && 'collapse-y-open')}
              inert={!serverError}
            >
              <div>
                <p role="alert" className="text-sm font-medium text-error-700">
                  {serverError ? t(`errors.${serverError}` as 'errors.failed') : null}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!agreed || pending}>
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader size="sm" tone="white" />
                  {t('dialog.confirm')}
                </span>
              ) : (
                t('dialog.confirm')
              )}
            </Button>
            <Button variant="secondary" onClick={close} disabled={pending}>
              {t('dialog.cancel')}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  )
}
