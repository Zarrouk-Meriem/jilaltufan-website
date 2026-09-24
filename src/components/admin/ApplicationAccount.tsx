import type { UIFieldServerProps } from 'payload'
import React from 'react'

const fmt = (iso: string | null | undefined, ar: boolean) =>
  iso
    ? new Intl.DateTimeFormat(ar ? 'ar' : 'en', {
        dateStyle: 'medium',
        timeStyle: 'short',
        numberingSystem: 'latn',
      }).format(new Date(iso))
    : null

/**
 * On an accepted application: the account it opened and whether the person is using it —
 * invited when, activated or not — so staff can tell at a glance whether to re-send the
 * invite, without searching the accounts list.
 */
export async function ApplicationAccountField({ data, i18n, payload }: UIFieldServerProps) {
  const ar = i18n.language === 'ar'
  const id = typeof data?.id === 'number' ? data.id : null
  const wrap = (body: React.ReactNode) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ marginBottom: '0.5rem' }}>{ar ? 'الحساب' : 'Account'}</h4>
      {body}
    </div>
  )
  if (!id) return null
  const found = await payload.find({
    collection: 'accounts',
    where: { application: { equals: id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const account = found.docs[0]
  if (!account)
    return wrap(
      <p className="field-description">
        {ar
          ? 'لم يُفتح حساب بعد. يُفتح عند القبول، أو بتفعيل «أعد إرسال الدعوة».'
          : 'No account yet. It opens on acceptance, or by ticking «Re-send the invite».'}
      </p>,
    )

  const invited = fmt(account.inviteSentAt, ar)
  const activated = fmt(account.passwordSetAt, ar)
  return wrap(
    <>
      <p style={{ margin: 0 }}>
        <a href={`/admin/collections/accounts/${account.id}`}>{account.email}</a>
      </p>
      <p className="field-description" style={{ marginTop: '0.25rem' }}>
        {activated
          ? ar
            ? `مفعّل: اختار كلمة السر في ${activated}.`
            : `Active: password chosen on ${activated}.`
          : ar
            ? `لم يُفعَّل بعد${invited ? ` (أُرسلت الدعوة في ${invited})` : ''}.`
            : `Not activated yet${invited ? ` (invite sent on ${invited})` : ''}.`}
        {account.disabled ? (ar ? ' الحساب موقوف.' : ' The account is deactivated.') : null}
      </p>
    </>,
  )
}
