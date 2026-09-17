import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Logo } from '@/components/brand/Logo'
import { Mark } from '@/components/brand/Mark'
import { Accordion } from '@/components/ui/Accordion'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Callout } from '@/components/ui/Callout'
import { DateBlock } from '@/components/ui/DateBlock'
import { EmptyState } from '@/components/ui/EmptyState'
import { Checkbox, Input, Textarea } from '@/components/ui/Field'
import { StyleguideCombobox } from './StyleguideCombobox'
import { Loader } from '@/components/ui/Loader'
import { OrdinalLabel } from '@/components/ui/OrdinalLabel'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { TextLink } from '@/components/ui/TextLink'
import { STYLEGUIDE_ENABLED } from '@/lib/site'

export const dynamic = 'force-dynamic'

const colours = [
  ['--red-600', 'Brand red'],
  ['--red-700', 'Red hover'],
  ['--red-50', 'Callout'],
  ['--ink-900', 'Headings'],
  ['--ink-700', 'Body'],
  ['--ink-500', 'Secondary'],
  ['--paper', 'Surface'],
  ['--paper-2', 'Alt surface'],
  ['--line', 'Hairline'],
  ['--navy-900', 'Deep navy'],
  ['--navy-800', 'Navy'],
  ['--blue-700', 'Blue'],
] as const

const scale = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const

function Block({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  return (
    <section id={id} className="border-t border-line py-12">
      <h2 className="mb-6 text-lg">{title}</h2>
      {children}
    </section>
  )
}

export default async function StyleguidePage({ params }: PageProps<'/[locale]/styleguide'>) {
  if (!STYLEGUIDE_ENABLED) notFound()
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()
  const ar = locale === 'ar'
  const sample = ar
    ? 'بالعلم نتحرّر — أكاديمية جيل الطوفان 2026'
    : 'Through knowledge, we are liberated — 2026'
  const ordinals = t.raw('common.ordinals') as string[]

  return (
    <div className="container-site py-16">
      <SectionHeading
        as="h1"
        locale={locale}
        title={t('styleguide.title')}
        intro={t('styleguide.intro')}
        ordinal={ar ? 'مرجع داخلي' : 'Internal reference'}
      />

      <Block id="colour" title={ar ? 'الألوان' : 'Colour'}>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {colours.map(([token, label]) => (
            <li key={token} className="flex flex-col gap-2">
              <span
                className="block h-16 rounded-brand border border-line"
                style={{ background: `var(${token})` }}
              />
              <span className="text-xs font-medium text-ink-900" dir="ltr">
                {token}
              </span>
              <span className="text-xs text-ink-500">{label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-brand p-8 surface-navy">
            <p className="text-on-navy">{ar ? 'نص أبيض على الكحلي' : 'White text on navy'}</p>
            <p className="text-on-navy-muted">
              {ar ? 'نص ثانوي بشفافية 78٪' : 'Muted text at 78%'}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <Mark size={28} />
              <span className="block h-[3px] w-12 bg-red-600" />
            </div>
          </div>
          <div className="rounded-brand border border-line pattern-keffiyeh-paper p-8">
            <p className="text-ink-900">
              {ar ? 'نسيج الكوفية على الورق الثاني' : 'Keffiyeh net on paper-2'}
            </p>
            <p className="text-ink-500">
              4–6% — {ar ? 'لا يُستعمل خلف نص طويل' : 'never behind body copy'}
            </p>
          </div>
        </div>
      </Block>

      <Block id="type" title={ar ? 'الخط' : 'Type'}>
        <p className="mb-6 text-sm text-ink-500">
          Poppins →{' '}
          {ar
            ? 'IBM Plex Sans Arabic (بديل Janna LT مؤقتًا)'
            : 'IBM Plex Sans Arabic (stand-in for Janna LT)'}
        </p>
        <ul className="flex flex-col gap-4">
          {scale.map((s) => (
            <li
              key={s}
              className="flex flex-col gap-1 border-b border-line pb-4 sm:flex-row sm:items-baseline sm:gap-6"
            >
              <span className="w-24 shrink-0 text-xs text-ink-500" dir="ltr">
                --text-{s}
              </span>
              <span
                className={
                  s === 'xs' || s === 'sm' || s === 'base' || s === 'md'
                    ? 'text-ink-700'
                    : 'font-bold text-ink-900'
                }
                style={{ fontSize: `var(--text-${s})`, lineHeight: 'var(--leading-heading)' }}
              >
                {sample}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-8 measure">{t('site.mission')}</p>
      </Block>

      <Block id="logo" title={ar ? 'الشعار والعلامة' : 'Logo & mark'}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col items-start gap-6 rounded-brand border border-line p-8">
            <Logo locale="ar" height={64} />
            <Logo locale="en" height={48} />
            <div className="flex items-end gap-6">
              <Mark size={64} />
              <Mark size={32} />
              <Mark size={16} />
              <Mark size={8} />
            </div>
          </div>
          <div className="flex flex-col items-start gap-6 rounded-brand pattern-keffiyeh-navy p-8 surface-navy">
            <Logo locale="ar" surface="dark" height={64} />
            <Logo locale="en" surface="dark" height={48} />
            <span className="inline-flex items-center justify-center bg-red-600 p-3">
              <Mark size={32} tone="white" />
            </span>
          </div>
        </div>
      </Block>

      <Block id="headings" title={ar ? 'عناوين الأقسام' : 'Section headings'}>
        <div className="grid gap-12 md:grid-cols-2">
          <SectionHeading
            locale={locale}
            ordinal={ordinals[0]}
            title={ar ? 'رسالة **الأكاديمية**' : 'The Academy’s **mission**'}
            intro={
              ar
                ? 'مقدّمة قصيرة تحت العنوان مع الخط الأحمر.'
                : 'A short intro beneath the heading and its red rule.'
            }
          />
          <div className="rounded-brand p-8 surface-navy">
            <SectionHeading
              locale={locale}
              ordinal={ordinals[1]}
              onNavy
              title={ar ? 'مخيمات **جيل الطوفان**' : 'The **Jeel Al-Toufan** Camp'}
              intro={
                ar
                  ? 'على الكحلي: الكلمة المميّزة بيضاء والخط أبيض.'
                  : 'On navy: the accent word and the rule are white.'
              }
            />
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-6">
          {ordinals.slice(0, 4).map((o) => (
            <OrdinalLabel key={o} locale={locale}>
              {o}
            </OrdinalLabel>
          ))}
        </div>
      </Block>

      <Block id="buttons" title={ar ? 'الأزرار والروابط' : 'Buttons & links'}>
        <div className="flex flex-wrap items-center gap-3">
          <Button>{t('nav.apply')}</Button>
          <Button variant="secondary">{t('home.exploreCta')}</Button>
          <Button variant="ghost">{t('common.readMore')}</Button>
          <Button disabled>
            <Loader size="sm" tone="white" />
            {t('common.loading')}
          </Button>
          <Button size="sm">{t('common.viewAll')}</Button>
          <Button size="lg">{t('nav.apply')}</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-brand p-6 surface-navy">
          <ButtonLink href="/apply">{t('nav.apply')}</ButtonLink>
          <ButtonLink href="/programs" variant="onNavy">
            {t('home.exploreCta')}
          </ButtonLink>
        </div>
        <p className="mt-6 flex flex-wrap gap-6">
          <TextLink href="/programs">{t('nav.programs')}</TextLink>
          <TextLink href="/schedule" tone="red">
            {t('nav.schedule')}
          </TextLink>
        </p>
      </Block>

      <Block id="loader" title={ar ? 'المُحمِّل' : 'Loader'}>
        <div className="flex flex-wrap items-center gap-10">
          <Loader size="sm" label={t('common.loading')} />
          <Loader size="md" label={t('common.loading')} />
          <Loader size="lg" label={t('common.loading')} />
          <Loader size="md" tone="ink" label={t('common.loading')} />
        </div>
        <div className="mt-4 flex items-center gap-10 rounded-brand p-6 surface-navy">
          <Loader size="md" tone="white" label={t('common.loading')} />
          <Loader size="md" tone="red" label={t('common.loading')} />
        </div>
      </Block>

      <Block id="badges" title={ar ? 'الحالات' : 'Status badges'}>
        <div className="flex flex-wrap gap-3">
          <Badge>{t('status.upcoming')}</Badge>
          <Badge tone="accent">{t('status.startingSoon')}</Badge>
          <Badge tone="live" pulse>
            {t('status.live')}
          </Badge>
          <Badge tone="muted">{t('status.completed')}</Badge>
          <Badge tone="struck">{t('status.cancelled')}</Badge>
          <Badge>{t('status.registrationOpen')}</Badge>
          <Badge tone="muted">{t('status.registrationApplication')}</Badge>
          <Badge tone="muted">{t('status.registrationClosed')}</Badge>
        </div>
        <div className="mt-8 flex gap-4">
          <DateBlock day="14" month={t('common.months.sep')} weekday={ar ? 'الأحد' : 'Sun'} />
          <div className="rounded-brand p-3 surface-navy">
            <DateBlock tone="navy" day="12" month={t('common.months.oct')} />
          </div>
        </div>
      </Block>

      <Block id="callout" title={ar ? 'التنبيه والفراغ' : 'Callout & empty state'}>
        <div className="grid gap-6 md:grid-cols-2">
          <Callout title={ar ? 'ملاحظة' : 'Note'}>
            <p>
              {ar
                ? 'جميع الحصص مباشرة على Zoom؛ لا توجد تسجيلات.'
                : 'All sessions are live on Zoom; there are no recordings.'}
            </p>
          </Callout>
          <EmptyState
            title={ar ? 'لا توجد حصص قادمة' : 'No upcoming sessions'}
            body={ar ? 'سيظهر الجدول هنا عند نشره.' : 'The schedule appears here once published.'}
            action={
              <ButtonLink href="/programs" variant="secondary" size="sm">
                {t('nav.programs')}
              </ButtonLink>
            }
          />
        </div>
      </Block>

      <Block id="accordion" title={ar ? 'القائمة القابلة للطي' : 'Accordion'}>
        <Accordion
          items={[1, 2, 3].map((n) => ({
            id: `session-${n}`,
            heading: `${ordinals[n - 1]} — ${ar ? 'عنوان الحصة' : 'Session title'}`,
            meta: `${ar ? 'الأحد 14 سبتمبر' : 'Sun 14 Sep'} · 16:00 ${t('common.alQudsTime')}`,
            content: (
              <p className="measure">
                {t('common.placeholder')} — {t('site.mission')}
              </p>
            ),
          }))}
        />
      </Block>

      <Block id="forms" title={ar ? 'النماذج' : 'Forms'}>
        <form className="grid max-w-xl gap-5" onSubmit={undefined}>
          <Input
            id="sg-name"
            label={ar ? 'الاسم الكامل' : 'Full name'}
            required
            placeholder={ar ? 'اكتب اسمك' : 'Your name'}
          />
          <Input
            id="sg-email"
            label={ar ? 'البريد الإلكتروني' : 'Email'}
            type="email"
            hint={ar ? 'نرسل التأكيد إلى هذا البريد.' : 'We send the confirmation here.'}
          />
          <Input
            id="sg-err"
            label={ar ? 'رقم الهاتف' : 'Phone'}
            defaultValue="abc"
            error={ar ? 'أدخل رقمًا صحيحًا.' : 'Enter a valid number.'}
          />
          <StyleguideCombobox label={ar ? 'البرنامج' : 'Program'} />
          <Textarea id="sg-text" label={ar ? 'الدافع' : 'Motivation'} />
          <Checkbox
            id="sg-consent"
            label={ar ? 'أوافق على سياسة الخصوصية' : 'I agree to the privacy policy'}
          />
          <Input id="sg-disabled" label={ar ? 'معطّل' : 'Disabled'} disabled defaultValue="—" />
        </form>
      </Block>

      <Block id="breadcrumbs" title={ar ? 'مسار التنقل' : 'Breadcrumbs'}>
        <Breadcrumbs
          label="Breadcrumb"
          items={[
            { label: t('nav.programs'), href: '/programs' },
            { label: ar ? 'فلسطين بوصلتنا' : 'Palestine, Our Compass' },
          ]}
        />
      </Block>
    </div>
  )
}
