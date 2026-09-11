import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

const control =
  'w-full rounded-brand border border-line-strong bg-paper px-3.5 text-ink-900 placeholder:text-ink-500 ' +
  'transition-[border-color,box-shadow] duration-150 ease-brand ' +
  'hover:border-ink-700 focus:border-ink-900 focus:outline-none focus:shadow-[var(--focus-ring)] ' +
  'aria-[invalid=true]:border-red-600 disabled:bg-paper-2 disabled:opacity-60'

type Common = { label: string; hint?: string; error?: string; required?: boolean; id: string }

function Wrap({
  label,
  hint,
  error,
  required,
  id,
  children,
}: Common & { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-900">
        {label}
        {required ? (
          <span aria-hidden className="ms-1 text-red-600">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function describedBy(id: string, hint?: string, error?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined
}

export function Input({
  label,
  hint,
  error,
  required,
  id,
  className,
  ...rest
}: Common & ComponentProps<'input'>) {
  return (
    <Wrap {...{ label, hint, error, required, id }}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        className={cn(control, 'h-11', className)}
        {...rest}
      />
    </Wrap>
  )
}

export function Textarea({
  label,
  hint,
  error,
  required,
  id,
  className,
  ...rest
}: Common & ComponentProps<'textarea'>) {
  return (
    <Wrap {...{ label, hint, error, required, id }}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        className={cn(control, 'min-h-32 py-2.5', className)}
        {...rest}
      />
    </Wrap>
  )
}

export function Select({
  label,
  hint,
  error,
  required,
  id,
  className,
  children,
  ...rest
}: Common & ComponentProps<'select'>) {
  return (
    <Wrap {...{ label, hint, error, required, id }}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        className={cn(
          control,
          'h-11 appearance-none bg-[length:1rem] bg-[position:right_0.75rem_center] bg-no-repeat rtl:bg-[position:left_0.75rem_center]',
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232B3439' stroke-width='1.5'><path d='m6 9 6 6 6-6'/></svg>\")",
        }}
        {...rest}
      >
        {children}
      </select>
    </Wrap>
  )
}

export function Checkbox({
  label,
  error,
  id,
  className,
  ...rest
}: { label: React.ReactNode; error?: string; id: string } & Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-start gap-3 text-sm text-ink-700">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'mt-1 size-4 shrink-0 rounded-brand border border-line-strong accent-red-600 focus:shadow-[var(--focus-ring)] focus:outline-none',
            className,
          )}
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
