'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Callout } from '@/components/ui/Callout'
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Field'
import { Link } from '@/i18n/navigation'
import { z } from 'zod'
import { AGE_RANGES, applySchema, type ApplyInput } from '@/lib/forms/apply-schema'

// The honeypot is a SERVER check; the client must not block on it (a bot that runs JS would
// simply learn to leave the field empty, and a real submission is never affected).
const clientSchema = applySchema.extend({ website: z.string().optional() })
import type { ApplyResult } from '@/app/(frontend)/[locale]/apply/actions'

type Props = {
  programSlug: string
  mode: 'open' | 'application'
  action: (prev: ApplyResult, fd: FormData) => Promise<ApplyResult>
  turnstileSiteKey?: string
  onSuccess?: (r: Extract<ApplyResult, { status: 'success' }>) => void
}

export function ApplyForm({ programSlug, mode, action, turnstileSiteKey }: Props) {
  const t = useTranslations('apply')
  const locale = useLocale() as 'ar' | 'en'
  const [state, formAction] = useActionState(action, { status: 'idle' })
  const [pending, startTransition] = useTransition()
  const errorRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ApplyInput>({
    resolver: zodResolver(clientSchema),
    mode: 'onBlur',
    defaultValues: {
      program: programSlug,
      locale,
      website: '',
      phone: '',
      city: '',
      hearAbout: '',
    },
  })

  // Server-side field errors (shouldn't differ from the client's, but the server is the truth).
  useEffect(() => {
    if (state.status !== 'error') return
    for (const [k, v] of Object.entries(state.fieldErrors ?? {}))
      setError(k as keyof ApplyInput, { message: v })
    errorRef.current?.focus()
  }, [state, setError])

  const err = (k: keyof ApplyInput) => {
    const m = errors[k]?.message
    return m ? t(`errors.${m}` as 'errors.required') : undefined
  }

  // The form element comes from the event, not a ref read during render.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    return handleSubmit(() => {
      const fd = new FormData(form)
      startTransition(() => formAction(fd))
    })(e)
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6" aria-busy={pending}>
      <input type="hidden" {...register('program')} value={programSlug} />
      <input type="hidden" {...register('locale')} value={locale} />
      {/* Honeypot — invisible to people, irresistible to bots. */}
      <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      {state.status === 'error' && state.formError ? (
        <div ref={errorRef} tabIndex={-1} role="alert">
          <Callout>{t(`errors.${state.formError}` as 'errors.server')}</Callout>
        </div>
      ) : null}

      <Input
        id="fullName"
        label={t('fields.fullName')}
        required
        autoComplete="name"
        error={err('fullName')}
        {...register('fullName')}
      />
      <Input
        id="email"
        type="email"
        label={t('fields.email')}
        required
        autoComplete="email"
        hint={t('hints.email')}
        error={err('email')}
        dir="ltr"
        {...register('email')}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          id="phone"
          type="tel"
          label={t('fields.phone')}
          autoComplete="tel"
          hint={t('hints.phone')}
          error={err('phone')}
          dir="ltr"
          {...register('phone')}
        />
        <Select
          id="ageRange"
          label={t('fields.ageRange')}
          required
          error={err('ageRange')}
          defaultValue=""
          {...register('ageRange')}
        >
          <option value="" disabled>
            {t('agePlaceholder')}
          </option>
          {AGE_RANGES.map((a) => (
            <option key={a} value={a}>
              {t(`ages.${a}` as 'ages.18-24')}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          id="country"
          label={t('fields.country')}
          required
          autoComplete="country-name"
          error={err('country')}
          {...register('country')}
        />
        <Input
          id="city"
          label={t('fields.city')}
          autoComplete="address-level2"
          error={err('city')}
          {...register('city')}
        />
      </div>
      <Textarea
        id="motivation"
        label={t('fields.motivation')}
        required
        hint={t('hints.motivation')}
        error={err('motivation')}
        {...register('motivation')}
      />
      <Input
        id="hearAbout"
        label={t('fields.hearAbout')}
        hint={t('hints.hearAbout')}
        error={err('hearAbout')}
        {...register('hearAbout')}
      />
      <Checkbox
        id="consent"
        error={err('consent')}
        label={t.rich('fields.consent', {
          privacy: (chunks) => (
            <Link href="/privacy" className="underline decoration-red-600 underline-offset-2">
              {chunks}
            </Link>
          ),
        })}
        {...register('consent')}
      />
      {turnstileSiteKey ? (
        <div
          className="cf-turnstile"
          data-sitekey={turnstileSiteKey}
          data-language={locale}
          aria-label={t('turnstileLabel')}
        />
      ) : null}
      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t('submitting') : mode === 'open' ? t('submitOpen') : t('submit')}
        </Button>
      </div>
    </form>
  )
}
