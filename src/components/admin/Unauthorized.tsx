import type { AdminViewServerProps } from 'payload'
import React from 'react'
import { SignOutButton } from './UnauthorizedSignOut'

/**
 * Replaces Payload's «Unauthorized» page. The windows and the admin share one sign-in
 * cookie, so a browser last signed in to a student or instructor window lands here on
 * /admin — and Payload's own «Log out» calls /api/users/logout, which refuses any account
 * that is not a staff user («Incorrect collection»): the cookie stayed and the page was a
 * dead end (seen on production, 2026-09-25). This one says who is signed in and signs that
 * account out through its own collection before opening the staff sign-in.
 */
export function UnauthorizedView({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult
  const user = req.user as { collection?: string; email?: string; locale?: string } | null
  const collection = user?.collection ?? 'users'
  const isWindowAccount = collection === 'accounts'
  const locale = user?.locale === 'en' ? 'en' : 'ar'
  // A student or instructor reads it in the language they chose for their window.
  const ar = isWindowAccount ? locale === 'ar' : req.i18n.language === 'ar'

  return (
    <div className="unauthorized" dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: '36rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>
        {ar ? 'لوحة الإدارة لفريق الأكاديمية' : 'The admin is for academy staff'}
      </h1>
      <p style={{ marginBottom: '0.5rem' }}>
        {isWindowAccount
          ? ar
            ? 'أنت داخلٌ الآن بحساب نافذة الطالب أو المحاضر:'
            : 'This browser is signed in to a student or instructor window as:'
          : ar
            ? 'هذا الحساب لا يملك صلاحية دخول لوحة الإدارة:'
            : 'This account cannot enter the admin:'}
      </p>
      {user?.email ? (
        <p style={{ marginBottom: '1rem', fontWeight: 600 }}>
          <bdi dir="ltr">{user.email}</bdi>
        </p>
      ) : null}
      <p className="field-description" style={{ marginBottom: '1.5rem' }}>
        {ar
          ? 'للدخول بحساب الفريق اخرج من هذا الحساب أولًا؛ يُفتح بعدها باب الدخول إلى اللوحة.'
          : 'To sign in with a staff account, sign out of this one first; the admin sign-in opens next.'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <SignOutButton
          collection={collection}
          label={ar ? 'اخرج وادخل بحساب الفريق' : 'Sign out and sign in as staff'}
        />
        {isWindowAccount ? (
          <a href={`/${locale}/account`}>{ar ? 'العودة إلى نافذتي' : 'Back to my window'}</a>
        ) : null}
      </div>
    </div>
  )
}
