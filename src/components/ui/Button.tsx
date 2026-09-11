import type { ComponentProps, ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'onNavy'
type Size = 'md' | 'lg' | 'sm'

const base =
  'inline-flex items-center justify-center gap-2 rounded-brand font-medium whitespace-nowrap select-none ' +
  'transition-[background-color,color,border-color] duration-150 ease-brand ' +
  'disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-700',
  secondary: 'border border-ink-900 text-ink-900 bg-transparent hover:bg-ink-900 hover:text-white',
  ghost: 'text-ink-900 hover:bg-paper-2',
  onNavy: 'border border-on-navy text-on-navy bg-transparent hover:bg-on-navy hover:text-navy-900',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function buttonClass({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: Variant
  size?: Size
  className?: string
}) {
  return cn(base, variants[variant], sizes[size], className)
}

type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size }

export function Button({ variant, size, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...rest} />
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, 'className'> & {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

export function ButtonLink({ variant, size, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass({ variant, size, className })} {...rest} />
}
