'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Loader } from '@/components/ui/Loader'
import { Callout } from '@/components/ui/Callout'
import { Input, Textarea } from '@/components/ui/Field'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { contactSchema, type ContactInput } from '@/lib/forms/contact-schema'
import type { ContactResult } from '@/app/(frontend)/[locale]/contact/actions'

const clientSchema = contactSchema.extend({ website: z.string().optional() })

export function ContactForm({
  action,
}: {
  action: (prev: ContactResult, fd: FormData) => Promise<ContactResult>
}) {
  const t = useTranslations('contact')
  const locale = useLocale() as 'ar' | 'en'
  const [done, setDone] = useState(false)
  const [state, formAction] = useActionState(
    async (prev: ContactResult, fd: FormData) => {
      const r = await action(prev, fd)
      if (r.status === 'success') setDone(true)
      return r
    },
    { status: 'idle' } as ContactResult,
  )
  const [pending, startTransition] = useTransition()
  const errorRef = useRef<HTMLDivElement>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(clientSchema),
    mode: 'onBlur',
    defaultValues: { locale, website: '' },
  })

  useEffect(() => {
    if (state.status !== 'error') return
    for (const [k, v] of Object.entries(state.fieldErrors ?? {}))
      setError(k as keyof ContactInput, { message: v })
    errorRef.current?.focus()
  }, [state, setError])

  const err = (k: keyof ContactInput) =>
    errors[k]?.message ? t(`errors.${errors[k]!.message}` as 'errors.required') : undefined
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    return handleSubmit(() => {
      const fd = new FormData(form)
      startTransition(() => formAction(fd))
    })(e)
  }

  if (done) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="enter rounded-brand border border-line bg-paper-2 p-8 md:p-12"
      >
        <SectionHeading
          locale={locale}
          size="md"
          title={t('successTitle')}
          intro={t('successBody')}
        />
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6" aria-busy={pending}>
      <input type="hidden" {...register('locale')} value={locale} />
      <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>
      {state.status === 'error' && state.formError ? (
        <div ref={errorRef} tabIndex={-1} role="alert">
          <Callout>{t(`errors.${state.formError}` as 'errors.server')}</Callout>
        </div>
      ) : null}
      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          id="name"
          label={t('fields.name')}
          required
          autoComplete="name"
          error={err('name')}
          {...register('name')}
        />
        <Input
          id="email"
          type="email"
          label={t('fields.email')}
          required
          autoComplete="email"
          dir="ltr"
          error={err('email')}
          {...register('email')}
        />
      </div>
      <Input
        id="subject"
        label={t('fields.subject')}
        required
        error={err('subject')}
        {...register('subject')}
      />
      <Textarea
        id="message"
        label={t('fields.message')}
        required
        hint={t('hints.message')}
        error={err('message')}
        {...register('message')}
      />
      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader size="sm" tone="white" /> : null}
          {pending ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  )
}
