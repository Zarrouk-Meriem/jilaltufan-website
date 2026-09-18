'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useController, useForm, useWatch, type FieldErrors as FormErrors } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Callout } from '@/components/ui/Callout'
import { Combobox } from '@/components/ui/Combobox'
import { Checkbox, FileInput, Input, RadioGroup, Textarea } from '@/components/ui/Field'
import { Loader } from '@/components/ui/Loader'
import { Link } from '@/i18n/navigation'
import {
  applyObject,
  CV_ACCEPT,
  GENDERS,
  HEAR_ABOUT,
  STEP_FIELDS,
  withApplyRules,
  type ApplyInput,
} from '@/lib/forms/apply-schema'
import type { ApplyResult } from '@/app/(frontend)/[locale]/apply/actions'
import type { DialOption } from '@/lib/dial-codes'
import { clearDraft, readDraft, writeDraft } from '@/lib/forms/apply-draft'
import { DateField } from './DateField'
import { PhoneField } from './PhoneField'
import { Stepper } from './Stepper'

// The honeypot is a SERVER check; the client must not block on it (a bot that runs JS would
// simply learn to leave the field empty, and a real submission is never affected).
const clientSchema = withApplyRules(applyObject.extend({ website: z.string().optional() }))

export type CountryOption = { value: string; label: string; flag?: string }

type Props = {
  action: (prev: ApplyResult, fd: FormData) => Promise<ApplyResult>
  /** Computed on the server so both renders list the same names in the same order. */
  countries: CountryOption[]
  dialCodes: DialOption[]
  turnstileSiteKey?: string
}

const STEP_KEYS = ['basics', 'affiliation', 'motivation'] as const

/** The first step that owns one of the fields in error, so it can be shown. */
function stepWithErrors(errors: Partial<Record<keyof ApplyInput, unknown>>) {
  const keys = Object.keys(errors) as (keyof ApplyInput)[]
  return STEP_FIELDS.findIndex((fields) => fields.some((f) => keys.includes(f)))
}

export function ApplyForm({ action, countries, dialCodes, turnstileSiteKey }: Props) {
  const t = useTranslations('apply')
  const locale = useLocale() as 'ar' | 'en'
  const [pending, startTransition] = useTransition()
  const [step, setStep] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  // The stepper sticks under the header; a hairline appears only once it is stuck.
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setStuck(!e!.isIntersecting), { threshold: 1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const {
    register,
    handleSubmit,
    setError,
    trigger,
    control,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ApplyInput>({
    resolver: zodResolver(clientSchema),
    mode: 'onBlur',
    defaultValues: {
      locale,
      website: '',
      fullName: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      nationality: '',
      country: '',
      profession: '',
      affiliationName: '',
      facebook: '',
      instagram: '',
      linkedin: '',
      hearAbout: '' as never,
      motivation: '',
      aboutYou: '',
    },
  })
  const affiliated = useWatch({ control, name: 'affiliated' })

  // Draft: restore once after mount (the server never sees the browser's storage),
  // then save on every change and on every step change; the confirmation clears it.
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    const draft = readDraft()
    if (!draft) return
    // The union in the schema (affiliated yes/no) makes the merged shape too wide for TS;
    // the values are the form's own input shape.
    reset({ ...getValues(), ...draft.values } as ApplyInput, { keepDefaultValues: true })
    // Deferred: the step and the notice are UI state, set from outside the render pass.
    const id = requestAnimationFrame(() => {
      setStep(Math.min(Math.max(draft.step, 0), STEP_KEYS.length - 1))
      setRestored(true)
    })
    return () => cancelAnimationFrame(id)
  }, [reset, getValues])
  const values = useWatch({ control })
  useEffect(() => {
    const timer = setTimeout(() => writeDraft(step, values as Partial<ApplyInput>), 300)
    return () => clearTimeout(timer)
  }, [values, step])
  const startOver = () => {
    clearDraft()
    reset()
    setRestored(false)
    goTo(0)
  }
  // The comboboxes are controlled: react-hook-form holds their value, a hidden input
  // carries it in the FormData the action reads.
  const nationality = useController({ control, name: 'nationality' })
  const country = useController({ control, name: 'country' })
  const hearAbout = useController({ control, name: 'hearAbout' })
  const phone = useController({ control, name: 'phone' })
  const dateOfBirth = useController({ control, name: 'dateOfBirth' })

  // Server-side field errors (shouldn't differ from the client's, but the server is the
  // truth): mark the fields and show the first step that owns one of them.
  const [state, formAction] = useActionState(
    async (prev: ApplyResult, fd: FormData) => {
      const r = await action(prev, fd)
      if (r.status === 'success') clearDraft()
      if (r.status === 'error') {
        const fieldErrors = r.fieldErrors ?? {}
        for (const [k, v] of Object.entries(fieldErrors))
          setError(k as keyof ApplyInput, { message: v })
        const at = stepWithErrors(fieldErrors)
        if (at >= 0) setStep(at)
      }
      return r
    },
    { status: 'idle' } as ApplyResult,
  )

  const goTo = (i: number) => {
    setStep(i)
    // After the panel switch: bring the form into view and hand focus to its heading.
    requestAnimationFrame(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      formRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
      headingRef.current?.focus({ preventScroll: true })
    })
  }

  // The form-level message renders only once the state says so; hand it focus then.
  useEffect(() => {
    if (state.status === 'error' && state.formError) errorRef.current?.focus()
  }, [state])

  const err = (k: keyof ApplyInput) => {
    const m = errors[k]?.message
    return m ? t(`errors.${m}` as 'errors.required') : undefined
  }

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[step] as (keyof ApplyInput)[], { shouldFocus: true })
    if (ok) goTo(step + 1)
  }

  // The form element comes from the event, not a ref read during render.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    return handleSubmit(
      () => {
        const fd = new FormData(form)
        startTransition(() => formAction(fd))
      },
      (invalid: FormErrors<ApplyInput>) => {
        const at = stepWithErrors(invalid)
        if (at >= 0 && at !== step) goTo(at)
      },
    )(e)
  }

  const last = step === STEP_KEYS.length - 1
  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft
  const NextIcon = locale === 'ar' ? ArrowLeft : ArrowRight
  const panel = (i: number) => cn('flex flex-col gap-6', step === i ? 'enter' : 'hidden')

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="grid scroll-mt-28 gap-10"
      aria-busy={pending}
    >
      <input type="hidden" {...register('locale')} value={locale} />
      {/* Honeypot — invisible to people, irresistible to bots. */}
      <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div ref={sentinelRef} aria-hidden className="-mb-px h-px" />
      <div
        className={cn(
          // top-16 = the header bar once it has compacted on scroll, which is when this sticks.
          'sticky top-16 z-30 -mx-[var(--gutter)] bg-paper px-[var(--gutter)] py-4 transition-shadow duration-200 ease-brand motion-reduce:transition-none',
          stuck && 'shadow-[0_1px_0_0_var(--line)]',
        )}
      >
        <Stepper
          label={t('stepsLabel')}
          current={step}
          steps={STEP_KEYS.map((k) => ({
            title: t(`steps.${k}.title`),
            hint: t(`steps.${k}.hint`),
          }))}
          stepLabel={(n, total) => t('stepOf', { n, total })}
          onSelect={goTo}
        />
      </div>

      {restored ? (
        <p className="flex enter-fade flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-ink-700">
          <span>{t('draftRestored')}</span>
          <button
            type="button"
            onClick={startOver}
            className="link-grow relative font-medium text-ink-900"
          >
            {t('draftStartOver')}
          </button>
        </p>
      ) : null}
      {state.status === 'error' && state.formError ? (
        <div ref={errorRef} tabIndex={-1} role="alert">
          <Callout>{t(`errors.${state.formError}` as 'errors.server')}</Callout>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-medium text-ink-500">
          {t('stepOf', { n: step + 1, total: STEP_KEYS.length })}
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 text-lg focus:outline-none"
          id="apply-step-title"
        >
          {t(`steps.${STEP_KEYS[step]}.title`)}
        </h2>
        <p className="mt-2 measure text-sm text-ink-700">{t(`steps.${STEP_KEYS[step]}.lead`)}</p>
      </div>

      {/* 1 · Basic information */}
      <section aria-labelledby="apply-step-title" inert={step !== 0} className={panel(0)}>
        <Input
          id="fullName"
          label={t('fields.fullName')}
          required
          autoComplete="name"
          error={err('fullName')}
          {...register('fullName')}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <RadioGroup
            id="gender"
            label={t('fields.gender')}
            required
            error={err('gender')}
            options={GENDERS.map((g) => ({ value: g, label: t(`genders.${g}`) }))}
            {...register('gender')}
          />
          <DateField
            id="dateOfBirth"
            name="dateOfBirth"
            label={t('fields.dateOfBirth')}
            required
            error={err('dateOfBirth')}
            value={dateOfBirth.field.value ?? ''}
            onChange={dateOfBirth.field.onChange}
            onBlur={dateOfBirth.field.onBlur}
            inputRef={dateOfBirth.field.ref}
            labels={{ day: t('date.day'), month: t('date.month'), year: t('date.year') }}
            noResultsLabel={t('noResults')}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
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
          <PhoneField
            id="phone"
            name="phone"
            label={t('fields.phone')}
            codeLabel={t('fields.phoneCode')}
            required
            hint={t('hints.phone')}
            placeholder={t('hints.phonePlaceholder')}
            error={err('phone')}
            options={dialCodes}
            value={phone.field.value ?? ''}
            onChange={phone.field.onChange}
            onBlur={phone.field.onBlur}
            inputRef={phone.field.ref}
            defaultCountry={country.field.value || nationality.field.value || undefined}
            noResultsLabel={t('noResults')}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Combobox
            id="nationality"
            name="nationality"
            label={t('fields.nationality')}
            required
            searchable={true}
            options={countries}
            value={nationality.field.value ?? ''}
            onChange={nationality.field.onChange}
            onBlur={nationality.field.onBlur}
            inputRef={nationality.field.ref}
            placeholder={t('selectPlaceholder')}
            noResultsLabel={t('noResults')}
            error={err('nationality')}
          />
          <Combobox
            id="country"
            name="country"
            label={t('fields.country')}
            required
            searchable={true}
            options={countries}
            value={country.field.value ?? ''}
            onChange={country.field.onChange}
            onBlur={country.field.onBlur}
            inputRef={country.field.ref}
            placeholder={t('selectPlaceholder')}
            noResultsLabel={t('noResults')}
            error={err('country')}
          />
        </div>
        <Input
          id="profession"
          label={t('fields.profession')}
          required
          autoComplete="organization-title"
          hint={t('hints.profession')}
          error={err('profession')}
          {...register('profession')}
        />
      </section>

      {/* 2 · Affiliation and presence */}
      <section aria-labelledby="apply-step-title" inert={step !== 1} className={panel(1)}>
        <RadioGroup
          id="affiliated"
          label={t('fields.affiliated')}
          required
          error={err('affiliated')}
          options={[
            { value: 'yes', label: t('yes') },
            { value: 'no', label: t('no') },
          ]}
          {...register('affiliated')}
        />
        {/* Stays mounted and eases open; the schema ignores it unless the answer is yes. */}
        <div className={cn('collapse-y', affiliated === 'yes' && 'collapse-y-open')}>
          <div inert={affiliated !== 'yes'}>
            <Input
              id="affiliationName"
              label={t('fields.affiliationName')}
              required
              autoComplete="organization"
              error={err('affiliationName')}
              {...register('affiliationName')}
            />
          </div>
        </div>
        <div className="border-t border-line pt-6">
          <p className="text-sm font-medium text-ink-900">{t('linksTitle')}</p>
          <p className="mt-1 text-xs text-ink-500">{t('hints.links')}</p>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            <Input
              id="facebook"
              label={t('fields.facebook')}
              dir="ltr"
              autoComplete="url"
              error={err('facebook')}
              {...register('facebook')}
            />
            <Input
              id="instagram"
              label={t('fields.instagram')}
              dir="ltr"
              autoComplete="url"
              error={err('instagram')}
              {...register('instagram')}
            />
            <Input
              id="linkedin"
              label={t('fields.linkedin')}
              dir="ltr"
              autoComplete="url"
              error={err('linkedin')}
              {...register('linkedin')}
            />
          </div>
        </div>
      </section>

      {/* 3 · Motivation, CV, pledge */}
      <section aria-labelledby="apply-step-title" inert={step !== 2} className={panel(2)}>
        <Combobox
          id="hearAbout"
          name="hearAbout"
          label={t('fields.hearAbout')}
          required
          searchable={false}
          options={HEAR_ABOUT.map((h) => ({ value: h, label: t(`hearAboutOptions.${h}`) }))}
          value={hearAbout.field.value ?? ''}
          onChange={hearAbout.field.onChange}
          onBlur={hearAbout.field.onBlur}
          inputRef={hearAbout.field.ref}
          placeholder={t('selectPlaceholder')}
          noResultsLabel={t('noResults')}
          error={err('hearAbout')}
        />
        <Textarea
          id="motivation"
          label={t('fields.motivation')}
          required
          hint={t('hints.motivation')}
          error={err('motivation')}
          {...register('motivation')}
        />
        <Textarea
          id="aboutYou"
          label={t('fields.aboutYou')}
          required
          hint={t('hints.aboutYou')}
          error={err('aboutYou')}
          {...register('aboutYou')}
        />
        <FileInput
          id="cv"
          label={t('fields.cv')}
          hint={t('hints.cv')}
          accept={CV_ACCEPT}
          error={err('cv')}
          {...register('cv')}
        />
        <div className="flex flex-col gap-4 border-t border-line pt-6">
          <Checkbox
            id="pledge"
            error={err('pledge')}
            label={t.rich('fields.pledge', {
              conduct: (chunks) => (
                <Link href="/students" className="underline decoration-red-600 underline-offset-2">
                  {chunks}
                </Link>
              ),
            })}
            {...register('pledge')}
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
        </div>
        {turnstileSiteKey ? (
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            data-language={locale}
            aria-label={t('turnstileLabel')}
          />
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        {step > 0 ? (
          <Button type="button" variant="ghost" size="lg" onClick={() => goTo(step - 1)}>
            <BackIcon aria-hidden strokeWidth={1.5} className="size-4" />
            {t('back')}
          </Button>
        ) : (
          <span />
        )}
        {/* Distinct keys, so React never turns the clicked Next button into the submit
            button: validation resolves in a microtask, the re-render lands before the
            browser runs the click's default action, and a reused node would submit. */}
        {last ? (
          <Button key="submit" type="submit" size="lg" disabled={pending}>
            {pending ? <Loader size="sm" tone="white" /> : null}
            {pending ? t('submitting') : t('submit')}
          </Button>
        ) : (
          <Button key="next" type="button" size="lg" onClick={next}>
            {t('next')}
            <NextIcon aria-hidden strokeWidth={1.5} className="size-4" />
          </Button>
        )}
      </div>
    </form>
  )
}

function cn(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(' ')
}
