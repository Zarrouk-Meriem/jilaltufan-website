'use client'

import { Icon } from '@/components/icons/Icon'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Logo } from '@/components/brand/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { LanguageSwitch } from './LanguageSwitch'

export type NavItem = { href: string; label: string }

type Props = {
  locale: string
  primary: NavItem[]
  utility: NavItem[]
  apply: NavItem
  /** The way into the student and instructor windows (user decision, 2026-09-26). */
  signIn: NavItem
  labels: {
    mainNav: string
    utilityNav: string
    openMenu: string
    closeMenu: string
    switchLanguage: string
    logoHome: string
  }
}

export function Header({ locale, primary, utility, apply, signIn, labels }: Props) {
  const [compact, setCompact] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  // Close the menu when the route changes — adjusted during render, not in an effect.
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }
  const closeBtn = useRef<HTMLButtonElement>(null)
  const openBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock scroll while open; Escape closes; return focus to the trigger only after a close.
  const wasOpen = useRef(false)
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    if (open) closeBtn.current?.focus()
    else if (wasOpen.current) openBtn.current?.focus({ preventScroll: true })
    wasOpen.current = open
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
    }
  }, [open])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header
      data-compact={compact || undefined}
      // The header's own (in-flow) height never changes; only the bar inside shrinks. When
      // the header itself shrank, everything below it moved up 32px, Chrome's scroll
      // anchoring scrolled back to keep the hero in place, scrollY dropped under the
      // threshold, the header grew again — and the two fought for a dozen frames (the
      // visible "glitch" when scrolling started). `pointer-events-none` lets clicks
      // reach the page through the strip the compact bar no longer covers.
      className="pointer-events-none sticky top-0 z-50 h-20 [overflow-anchor:none] md:h-24"
    >
      <div
        className={cn(
          'pointer-events-auto bg-paper transition-[height,box-shadow] duration-200 ease-brand',
          compact
            ? 'h-16 shadow-[0_1px_0_0_var(--line)]'
            : 'h-20 shadow-[0_1px_0_0_transparent] md:h-24',
        )}
      >
        <div className="container-site flex h-full items-center justify-between gap-6">
          <Link href="/" aria-label={labels.logoHome} className="flex shrink-0 items-center">
            {/* One logo, scaled down (not swapped) when compact, so it shrinks in step with
                the header's height instead of popping to a second image mid-transition. */}
            <span
              className={cn(
                // Tailwind's scale-* utility sets the standalone `scale` property, not
                // `transform` — `transition-transform` alone would leave it unanimated.
                'block transition-[scale] duration-200 ease-brand',
                compact && 'md:scale-[var(--logo-compact-scale)]',
              )}
              style={
                { '--logo-compact-scale': locale === 'ar' ? 34 / 48 : 28 / 40 } as CSSProperties
              }
            >
              <Logo locale={locale} height={locale === 'ar' ? 48 : 40} priority />
            </span>
          </Link>

          <nav aria-label={labels.mainNav} className="hidden md:block">
            <ul className="flex items-center gap-7">
              {primary.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href as never}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'link-grow relative block py-2 text-sm transition-colors',
                        active
                          ? 'font-semibold text-ink-900 after:w-full'
                          : 'font-medium text-ink-700 hover:text-ink-900',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-5">
            <LanguageSwitch
              label={labels.switchLanguage}
              tone="muted"
              className="hidden md:inline-flex"
            />
            <Link
              href={signIn.href as never}
              className="link-grow relative hidden h-9 items-center text-sm text-ink-500 hover:text-ink-900 md:inline-flex"
            >
              {signIn.label}
            </Link>
            <ButtonLink href={apply.href as never} size="md" className="max-sm:hidden">
              {apply.label}
            </ButtonLink>
            <button
              ref={openBtn}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={labels.openMenu}
              onClick={() => setOpen(true)}
              className="inline-flex size-11 items-center justify-center rounded-brand text-ink-900 hover:bg-paper-2 md:hidden"
            >
              <Icon name="menu" className="size-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu — full-screen navy */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label={labels.mainNav}
        hidden={!open}
        className="pointer-events-auto fixed inset-0 z-[60] flex flex-col overflow-y-auto surface-navy md:hidden"
      >
        <div className="container-site flex h-20 items-center justify-between">
          <Logo locale={locale} surface="dark" height={locale === 'ar' ? 44 : 36} />
          <button
            ref={closeBtn}
            type="button"
            aria-label={labels.closeMenu}
            onClick={() => setOpen(false)}
            className="inline-flex size-11 items-center justify-center rounded-brand text-on-navy hover:bg-white/10"
          >
            <Icon name="close" className="size-6" />
          </button>
        </div>
        <nav aria-label={labels.mainNav} className="container-site mt-6 flex flex-1 flex-col">
          <ul className="flex flex-col">
            {primary.map((item) => (
              <li key={item.href} className="border-b border-on-navy-line">
                <Link
                  href={item.href as never}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(
                    'block py-5 text-2xl font-bold',
                    isActive(item.href) ? 'text-on-navy' : 'text-on-navy-muted',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-8 flex flex-col gap-4 text-on-navy-muted">
            {utility.map((u) => (
              <li key={u.href}>
                <Link href={u.href as never} className="text-md">
                  {u.label}
                </Link>
              </li>
            ))}
            <li>
              <LanguageSwitch label={labels.switchLanguage} tone="onNavy" className="inline-flex" />
            </li>
          </ul>
          <div className="mt-auto py-10">
            <ButtonLink href={apply.href as never} size="lg" className="w-full">
              {apply.label}
            </ButtonLink>
          </div>
        </nav>
      </div>
    </header>
  )
}
