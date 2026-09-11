import { getTranslations } from 'next-intl/server'
import { Logo } from '@/components/brand/Logo'
import { Link } from '@/i18n/navigation'
import { LanguageSwitch } from './LanguageSwitch'

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations()
  const year = new Date().getFullYear()

  const explore = [
    { href: '/about', label: t('footer.about') },
    { href: '/programs', label: t('nav.programs') },
    { href: '/schedule', label: t('nav.schedule') },
    { href: '/events', label: t('nav.events') },
    { href: '/about/structure', label: t('footer.structure') },
    { href: '/projects', label: t('footer.projects') },
  ]
  const quick = [
    { href: '/students', label: t('nav.students') },
    { href: '/instructors', label: t('nav.instructors') },
    { href: '/knowledge/minbar', label: t('footer.minbar') },
    { href: '/knowledge/materials', label: t('footer.materials') },
    { href: '/events', label: t('footer.camp') },
    { href: '/apply', label: t('nav.apply') },
  ]

  return (
    <footer className="mt-auto pattern-keffiyeh-navy surface-navy">
      <div className="container-site py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo locale={locale} surface="dark" height={locale === 'ar' ? 56 : 44} />
            <p className="mt-6 measure text-on-navy-muted">{t('site.mission')}</p>
            <p className="mt-6 text-sm font-medium text-on-navy">«{t('site.tagline')}»</p>
          </div>
          <nav
            aria-label={t('a11y.footerNavigation')}
            className="grid grid-cols-2 gap-8 md:col-span-5 md:col-start-7"
          >
            <div>
              <h2 className="mb-4 text-sm font-semibold text-on-navy">{t('footer.explore')}</h2>
              <ul className="flex flex-col gap-2.5">
                {explore.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href as never}
                      className="link-grow relative text-sm text-on-navy-muted hover:text-on-navy"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-sm font-semibold text-on-navy">{t('footer.quickLinks')}</h2>
              <ul className="flex flex-col gap-2.5">
                {quick.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href as never}
                      className="link-grow relative text-sm text-on-navy-muted hover:text-on-navy"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
          <div className="md:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-on-navy">{t('footer.contact')}</h2>
            <ul className="flex flex-col gap-2.5 text-sm text-on-navy-muted">
              <li>
                <Link href="/contact" className="link-grow relative hover:text-on-navy">
                  {t('nav.contact')}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@jilaltufan.com"
                  className="link-grow relative hover:text-on-navy"
                  dir="ltr"
                >
                  contact@jilaltufan.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-on-navy-line pt-6 text-xs text-on-navy-muted md:flex-row md:items-center md:justify-between">
          <p>{t('footer.rights', { year })}</p>
          <p>{t('footer.timeNote')}</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="link-grow relative hover:text-on-navy">
              {t('footer.privacy')}
            </Link>
            <Link href="/terms" className="link-grow relative hover:text-on-navy">
              {t('footer.terms')}
            </Link>
            <LanguageSwitch
              label={t('a11y.switchLanguage')}
              tone="onNavy"
              className="inline-flex h-auto text-xs"
            />
          </div>
        </div>
      </div>
    </footer>
  )
}
