import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Card, PageOpening } from '@/components/portal/pieces'
import { EnrollDialog } from '@/components/portal/EnrollDialog'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import type { Locale } from '@/i18n/routing'
import { getAccount } from '@/lib/auth/account'
import { canEnroll, enrollmentRows } from '@/lib/enrollment/access'
import { programState, type ProgramState, type Track } from '@/lib/enrollment/rules'
import { listPrograms } from '@/lib/queries'
import type { Program } from '@/payload-types'
import { enroll } from './actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/account/programs'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account.programs' })
  return { title: t('title') }
}

const TONES: Record<ProgramState, BadgeTone> = {
  enrolled: 'accent',
  available: 'neutral',
  'other-directed': 'muted',
  closed: 'muted',
}
const STATE_KEYS: Record<ProgramState, 'enrolled' | 'available' | 'otherDirected' | 'closed'> = {
  enrolled: 'enrolled',
  available: 'available',
  'other-directed': 'otherDirected',
  closed: 'closed',
}

/**
 * Where an accepted student chooses: Open Training (everyone), and one directed program.
 * Each card says plainly where the student stands with it — open, enrolled, or not
 * available because another directed program is theirs — and offers only what is possible.
 */
export default async function ProgramsPage({ params }: PageProps<'/[locale]/account/programs'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations('account.programs')

  const account = await getAccount()
  if (!account) redirect(`/${locale}/account/sign-in`)
  if (account.kind !== 'student') redirect(`/${locale}/account`)

  const [eligible, rows, programs] = await Promise.all([
    canEnroll(account),
    enrollmentRows(account),
    listPrograms(locale),
  ])
  const open = programs.filter((p) => p.track === 'open')
  const directed = programs.filter((p) => p.track === 'directed')

  const choice = (p: Program) => {
    const state = programState(
      {
        id: p.id,
        track: (p.track ?? 'directed') as Track,
        registrationMode: p.registrationMode,
        published: true,
      },
      rows,
    )
    return (
      <li key={p.id} className="flex">
        {/* One layout for every state: the badge above the title (a long one never wraps
            under it), and the action at the foot so buttons line up across a row. A card
            the student cannot take sits on the quieter paper. */}
        <Card
          tone={state === 'other-directed' || state === 'closed' ? 'quiet' : 'paper'}
          className="flex w-full flex-col gap-4"
        >
          <Badge tone={TONES[state]} className="self-start">
            {t(`state.${STATE_KEYS[state]}`)}
          </Badge>
          <h3 className="text-lg">{p.title}</h3>
          {p.shortDescription ? (
            <p className="measure text-sm text-ink-700">{p.shortDescription}</p>
          ) : null}
          {state === 'enrolled' || (state === 'available' && eligible) ? (
            <div className="mt-auto pt-2">
              {state === 'enrolled' ? (
                <ButtonLink href={`/account/programs/${p.slug}`} variant="secondary">
                  {t('open')}
                </ButtonLink>
              ) : (
                <EnrollDialog
                  program={p.title}
                  directed={p.track === 'directed'}
                  action={enroll.bind(null, locale, p.slug)}
                />
              )}
            </div>
          ) : null}
        </Card>
      </li>
    )
  }

  return (
    <>
      <PageOpening title={t('title')} intro={t('intro')} />
      <div className="flex flex-col gap-10">
        {!eligible ? (
          <Card>
            <p className="measure text-base text-ink-700">{t('notYet')}</p>
          </Card>
        ) : null}

        {open.length ? (
          <section aria-labelledby="open-title">
            <h2 id="open-title" className="text-xl">
              {t('openTitle')}
            </h2>
            <p className="mt-2 measure text-sm text-ink-500">{t('openIntro')}</p>
            <ul className="mt-5 grid gap-4">{open.map(choice)}</ul>
          </section>
        ) : null}

        {directed.length ? (
          <section aria-labelledby="directed-title">
            <h2 id="directed-title" className="text-xl">
              {t('directedTitle')}
            </h2>
            <p className="mt-2 measure text-sm text-ink-500">{t('directedIntro')}</p>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">{directed.map(choice)}</ul>
          </section>
        ) : null}
      </div>
    </>
  )
}
