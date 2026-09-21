import { getTranslations } from 'next-intl/server'
import { Logo } from '@/components/brand/Logo'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { textOr } from '@/lib/cms'
import { cn } from '@/lib/cn'
import { getFooter, getSiteSettings } from '@/lib/queries'
import { LanguageSwitch } from './LanguageSwitch'

type Column = { title: string; links: { href: string; label: string }[] }

/**
 * Footer global (blurb, columns, bottom note) and Site settings (contact email, WhatsApp,
 * social links) drive this; the built-in two columns are the fallback while the global is empty.
 */
export async function Footer({ locale }: { locale: string }) {
  const [t, footer, settings] = await Promise.all([
    getTranslations(),
    getFooter(locale as Locale),
    getSiteSettings(locale as Locale),
  ])
  const year = new Date().getFullYear()

  const defaults: Column[] = [
    {
      title: t('footer.explore'),
      links: [
        { href: '/about', label: t('footer.about') },
        { href: '/programs', label: t('nav.programs') },
        { href: '/schedule', label: t('nav.schedule') },
        { href: '/events', label: t('nav.events') },
        { href: '/about/structure', label: t('footer.structure') },
        { href: '/projects', label: t('footer.projects') },
      ],
    },
    {
      title: t('footer.quickLinks'),
      links: [
        { href: '/students', label: t('nav.students') },
        { href: '/instructors', label: t('nav.instructors') },
        { href: '/knowledge/minbar', label: t('footer.minbar') },
        { href: '/knowledge/materials', label: t('footer.materials') },
        { href: '/events', label: t('footer.camp') },
        { href: '/apply', label: t('nav.apply') },
      ],
    },
  ]
  const editorColumns: Column[] = (footer.columns ?? [])
    .filter((c) => c.title?.trim())
    .map((c) => ({
      title: c.title,
      links: (c.links ?? [])
        .filter((l) => l.label?.trim() && l.href?.trim())
        .map((l) => ({ href: l.href, label: l.label })),
    }))
  const columns = editorColumns.length ? editorColumns : defaults
  const email = settings.contactEmail
  const whatsapp = settings.whatsapp?.replace(/[^\d+]/g, '')
  const socials = (settings.socials ?? []).filter((s) => s.url?.trim())

  const linkClass = 'link-grow relative text-sm text-on-navy-muted hover:text-on-navy'
  const external = (href: string) => /^https?:\/\//.test(href)

  return (
    <footer className="mt-auto pattern-keffiyeh-navy surface-navy">
      <div className="container-site py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo locale={locale} surface="dark" height={locale === 'ar' ? 56 : 44} />
            <p className="mt-6 measure text-on-navy-muted">
              {textOr(footer.blurb, t('site.mission'))}
            </p>
            <p className="mt-6 text-sm font-medium text-on-navy">«{t('site.tagline')}»</p>
            {socials.length ? (
              <div className="mt-8">
                <h2 id="footer-follow" className="mb-3 text-sm font-semibold text-on-navy">
                  {t('footer.follow')}
                </h2>
                <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-labelledby="footer-follow">
                  {socials.map((s) => (
                    <li key={s.id ?? s.url}>
                      <a
                        href={s.url}
                        className={linkClass}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t(`social.${s.platform}` as 'social.other')}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <nav
            aria-label={t('a11y.footerNavigation')}
            className={cn(
              'grid gap-8 md:col-span-5 md:col-start-7',
              columns.length > 2 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2',
            )}
          >
            {columns.map((c) => (
              <div key={c.title}>
                <h2 className="mb-4 text-sm font-semibold text-on-navy">{c.title}</h2>
                <ul className="flex flex-col gap-2.5">
                  {c.links.map((l) => (
                    <li key={l.href + l.label}>
                      {external(l.href) ? (
                        <a href={l.href} className={linkClass}>
                          {l.label}
                        </a>
                      ) : (
                        <Link href={l.href as never} className={linkClass}>
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
                  href={`mailto:${email}`}
                  className="link-grow relative hover:text-on-navy"
                  dir="ltr"
                >
                  {email}
                </a>
              </li>
              {whatsapp ? (
                <li>
                  <a
                    href={`https://wa.me/${whatsapp.replace(/^\+/, '')}`}
                    className="link-grow relative hover:text-on-navy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('footer.whatsapp')}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-on-navy-line pt-6 text-xs text-on-navy-muted md:flex-row md:items-center md:justify-between">
          <p>{t('footer.rights', { year })}</p>
          <p>{textOr(footer.note, t('footer.timeNote'))}</p>
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
