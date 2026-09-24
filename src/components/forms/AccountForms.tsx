'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { Callout } from '@/components/ui/Callout'
import { Input, RadioGroup, Textarea } from '@/components/ui/Field'
import { FileInput } from '@/components/ui/FileInput'
import { SESSION_FILE_ACCEPT } from '@/lib/forms/session-file-schema'
import { Loader } from '@/components/ui/Loader'
import { TextLink } from '@/components/ui/TextLink'
import type { FormState } from '@/app/(portal)/[locale]/account/actions'

const idle: FormState = { status: 'idle' }

/** The honeypot every public form here carries: off-screen, never announced, never filled. */
function Honeypot() {
  return (
    <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="website">Website</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  )
}

/**
 * The line above the fields. It keeps its slot whether or not there is anything to say, so
 * an error arriving never pushes the form down (Motion rules).
 */
function FormError({ state }: { state: FormState }) {
  const t = useTranslations('account.errors')
  return (
    <div className="min-h-6">
      {state.status === 'error' && state.formError ? (
        <p role="alert" className="enter font-medium text-error-700">
          {t(state.formError)}
        </p>
      ) : null}
    </div>
  )
}

function Submit({ label, pending }: { label: string; pending: boolean }) {
  const t = useTranslations('account')
  return (
    <Button type="submit" disabled={pending} className="w-full justify-center">
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader size="sm" tone="white" />
          {t('working')}
        </span>
      ) : (
        label
      )}
    </Button>
  )
}

export function SignInForm({
  action,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>
}) {
  const t = useTranslations('account')
  const te = useTranslations('account.errors')
  const locale = useLocale()
  const [state, submit, pending] = useActionState(action, idle)
  const err = (k: string) => (state.fieldErrors?.[k] ? te(state.fieldErrors[k]) : undefined)

  return (
    <form action={submit} className="relative flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <Honeypot />
      <FormError state={state} />
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        required
        label={t('email')}
        error={err('email')}
      />
      <Input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        label={t('password')}
        error={err('password')}
      />
      <Submit label={t('signIn')} pending={pending} />
      <p className="text-sm text-ink-500">
        <TextLink href="/account/forgot">{t('forgotLink')}</TextLink>
      </p>
    </form>
  )
}

export function ForgotForm({
  action,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>
}) {
  const t = useTranslations('account')
  const te = useTranslations('account.errors')
  const locale = useLocale()
  const [state, submit, pending] = useActionState(action, idle)

  if (state.status === 'done')
    return (
      <Callout title={t('forgot.sentTitle')} className="enter">
        <p>{t('forgot.sent')}</p>
      </Callout>
    )

  return (
    <form action={submit} className="relative flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <Honeypot />
      <FormError state={state} />
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        required
        label={t('email')}
        hint={t('forgot.hint')}
        error={state.fieldErrors?.email ? te(state.fieldErrors.email) : undefined}
        lines={2}
      />
      <Submit label={t('forgot.action')} pending={pending} />
    </form>
  )
}

export function SetPasswordForm({
  token,
  action,
}: {
  token: string
  action: (prev: FormState, fd: FormData) => Promise<FormState>
}) {
  const t = useTranslations('account')
  const te = useTranslations('account.errors')
  const locale = useLocale()
  const [state, submit, pending] = useActionState(action, idle)
  const err = (k: string) => (state.fieldErrors?.[k] ? te(state.fieldErrors[k]) : undefined)

  return (
    <form action={submit} className="relative flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <Honeypot />
      <FormError state={state} />
      <Input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        label={t('newPassword')}
        hint={t('passwordHint')}
        error={err('password')}
        lines={2}
      />
      <Input
        id="confirm"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        label={t('confirmPassword')}
        error={err('confirm')}
      />
      <Submit label={t('setPassword.action')} pending={pending} />
      {state.status === 'error' && state.formError === 'tokenInvalid' ? (
        <p className="enter text-sm text-ink-500">
          <TextLink href="/account/forgot">{t('setPassword.newLink')}</TextLink>
        </p>
      ) : null}
    </form>
  )
}

/**
 * The name we call a student by and the language we write to them in. The success line
 * lives in a slot that is always there, so saving never nudges the form below it.
 */
export function ProfileForm({
  action,
  name,
  accountLocale,
  email,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>
  name: string
  accountLocale: 'ar' | 'en'
  email: string
}) {
  const t = useTranslations('account')
  const te = useTranslations('account.errors')
  const locale = useLocale()
  const [state, submit, pending] = useActionState(action, idle)

  return (
    <form action={submit} className="relative flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <FormError state={state} />
      <Input
        id="name"
        name="name"
        defaultValue={name}
        required
        label={t('profile.name')}
        error={state.fieldErrors?.name ? te(state.fieldErrors.name) : undefined}
      />
      <RadioGroup
        id="accountLocale"
        name="accountLocale"
        label={t('profile.language')}
        defaultValue={accountLocale}
        options={[
          { value: 'ar', label: 'العربية' },
          { value: 'en', label: 'English' },
        ]}
      />
      <Input
        id="profile-email"
        name="profile-email"
        value={email}
        dir="ltr"
        readOnly
        disabled
        label={t('email')}
        hint={t('profile.emailNote')}
        lines={2}
      />
      <Submit label={t('profile.save')} pending={pending} />
      <div className="min-h-6">
        {state.status === 'done' ? (
          <p role="status" className="enter font-medium text-ink-900">
            {t('profile.saved')}
          </p>
        ) : null}
      </div>
    </form>
  )
}

/** A new password for someone already signed in; the current one is asked for. */
export function ChangePasswordForm({
  action,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>
}) {
  const t = useTranslations('account')
  const te = useTranslations('account.errors')
  const locale = useLocale()
  const [state, submit, pending] = useActionState(action, idle)
  const err = (k: string) => (state.fieldErrors?.[k] ? te(state.fieldErrors[k]) : undefined)

  return (
    <form action={submit} className="relative flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <FormError state={state} />
      <Input
        id="current"
        name="current"
        type="password"
        autoComplete="current-password"
        required
        label={t('profile.currentPassword')}
        error={err('current')}
      />
      <Input
        id="new-password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        label={t('newPassword')}
        hint={t('passwordHint')}
        error={err('password')}
        lines={2}
      />
      <Input
        id="new-confirm"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        label={t('confirmPassword')}
        error={err('confirm')}
      />
      <Submit label={t('profile.changePassword')} pending={pending} />
      <div className="min-h-6">
        {state.status === 'done' ? (
          <p role="status" className="enter font-medium text-ink-900">
            {t('profile.passwordChanged')}
          </p>
        ) : null}
      </div>
    </form>
  )
}

/**
 * What a guest sends for one of their sessions. The list of sessions is the one the server
 * gave this page, so the form cannot offer a session that is not theirs — and the action
 * checks it again anyway.
 */
export function SessionFileForm({
  action,
  sessions,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>
  sessions: { id: number; label: string }[]
}) {
  const t = useTranslations('account')
  const te = useTranslations('account.errors')
  const locale = useLocale()
  const [state, submit, pending] = useActionState(action, idle)
  const err = (k: string) => (state.fieldErrors?.[k] ? te(state.fieldErrors[k]) : undefined)

  return (
    <form action={submit} className="relative flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <FormError state={state} />
      <RadioGroup
        id="session"
        name="session"
        required
        label={t('teaching.whichSession')}
        defaultValue={String(sessions[0]?.id ?? '')}
        options={sessions.map((s) => ({ value: String(s.id), label: s.label }))}
        error={err('session')}
      />
      <FileInput
        id="file"
        name="file"
        accept={SESSION_FILE_ACCEPT}
        required
        label={t('teaching.file')}
        hint={t('teaching.fileHint')}
        chooseLabel={t('teaching.choose')}
        emptyLabel={t('teaching.none')}
        error={err('file')}
      />
      <Textarea
        id="note"
        name="note"
        rows={3}
        label={t('teaching.note')}
        hint={t('teaching.noteHint')}
        error={err('note')}
      />
      <Submit label={t('teaching.send')} pending={pending} />
      <div className="min-h-6">
        {state.status === 'done' ? (
          <p role="status" className="enter font-medium text-ink-900">
            {t('teaching.sent')}
          </p>
        ) : null}
      </div>
    </form>
  )
}
