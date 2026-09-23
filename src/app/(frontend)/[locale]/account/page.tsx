import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { PageIntro } from '@/components/sections/PageIntro'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getAccount } from '@/lib/auth/account'
import { signOut } from './actions'

/** Per-visitor by definition: never prerendered, never cached, never indexed. */
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: stripAccent(t('title')), robots: { index: false, follow: false } }
}

/**
 * The window itself. Step 2 of PLAN.md §13.8 builds the door and this shell; the sections
 * behind it — the application, the sessions, the materials, the progress — are step 3.
 */
export default async function AccountPage({ params }: PageProps<'/[locale]/account'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations('account')

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)

  const signOutHere = signOut.bind(null, locale === 'en' ? 'en' : 'ar')

  return (
    <>
      <PageIntro locale={locale} title={t('title')} intro={t('intro')} />
      <div className="container-site py-14 md:py-20">
        <div className="max-w-2xl">
          <div className="rounded-brand border border-line p-6 md:p-8">
            <p className="text-xs font-medium text-ink-500">{t('signedInAs')}</p>
            <p className="mt-1 text-md font-medium text-ink-900">{account.name || account.email}</p>
            <p dir="ltr" className="text-start text-sm text-ink-500">
              {account.email}
            </p>
            <p className="mt-4">
              <Badge tone="muted">{t(`kind.${account.kind}`)}</Badge>
            </p>
          </div>

          <p className="mt-8 text-base text-ink-700">{t('shellNote')}</p>

          <form action={signOutHere} className="mt-8">
            <Button type="submit" variant="secondary">
              {t('signOut')}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
