import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { ChangePasswordForm, OfficialNameForm, ProfileForm } from '@/components/forms/AccountForms'
import { Card, PageOpening } from '@/components/portal/pieces'
import type { Locale } from '@/i18n/routing'
import { stripAccent } from '@/lib/accent'
import { getAccount } from '@/lib/auth/account'
import { getAccountInstructor } from '@/lib/queries'
import { Prose } from '@/components/content/Prose'
import { DuotoneImage } from '@/components/ui/DuotoneImage'
import { TextLink } from '@/components/ui/TextLink'
import { changePassword, updateOfficialName, updateProfile } from '../../actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account/profile'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: stripAccent(t('profile.title')), robots: { index: false, follow: false } }
}

/**
 * What a student may change about themselves: the name we call them by, the language we
 * write to them in, and their password. Their application stays as they submitted it — a
 * record of what was sent, not a form to edit later.
 */
export default async function ProfilePage({ params }: PageProps<'/[locale]/account/profile'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations()

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)
  // A guest sees their public profile as the site shows it; the team edits it (TODO.md:
  // whether guests may edit their own bio and photo is the academy's open decision).
  const instructor =
    account.kind === 'instructor' ? await getAccountInstructor(account, locale) : null
  const photo = instructor?.photo && typeof instructor.photo === 'object' ? instructor.photo : null

  return (
    <>
      <PageOpening title={t('account.profile.title')} intro={t('account.profile.intro')} />
      <div className="flex flex-col gap-5">
        {instructor ? (
          <Card title={t('account.teaching.profileTitle')}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="aspect-[4/5] w-32 shrink-0 overflow-hidden rounded-brand surface-navy">
                {photo?.url ? (
                  <DuotoneImage
                    src={photo.url}
                    alt={photo.alt}
                    width={photo.width ?? 600}
                    height={photo.height ?? 750}
                    className="h-full w-full"
                    sizes="128px"
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <p className="text-lg font-semibold text-ink-900">{instructor.name}</p>
                {instructor.role ? <p className="text-sm text-ink-500">{instructor.role}</p> : null}
                {instructor.shortBio ? (
                  <p className="measure text-base text-ink-700">{instructor.shortBio}</p>
                ) : null}
                <Prose data={instructor.bio} className="text-ink-700" />
                <p className="mt-2 measure text-sm text-ink-500">
                  {t('account.teaching.profileNote')}
                </p>
                {instructor.status === 'published' ? (
                  <TextLink href={`/instructors/${instructor.slug}`} className="self-start text-sm">
                    {t('account.teaching.publicPage')}
                  </TextLink>
                ) : null}
              </div>
            </div>
          </Card>
        ) : null}
        <Card title={t('account.profile.detailsTitle')}>
          <ProfileForm
            action={updateProfile}
            name={account.name ?? ''}
            accountLocale={account.locale === 'en' ? 'en' : 'ar'}
            email={account.email}
          />
        </Card>
        {account.kind === 'student' ? (
          <div id="official-name" className="scroll-mt-28">
            <Card title={t('account.officialName.title')}>
              <p className="mb-5 measure text-sm text-ink-700">{t('account.officialName.intro')}</p>
              <OfficialNameForm
                action={updateOfficialName}
                nameAr={account.officialNameAr ?? ''}
                nameEn={account.officialNameEn ?? ''}
              />
            </Card>
          </div>
        ) : null}
        <Card title={t('account.profile.passwordTitle')}>
          <ChangePasswordForm action={changePassword} />
        </Card>
      </div>
    </>
  )
}
