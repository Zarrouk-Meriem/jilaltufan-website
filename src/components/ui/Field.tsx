import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const control =
  'w-full scroll-mt-44 rounded-brand border border-line-strong bg-paper px-3.5 text-ink-900 placeholder:text-ink-500 ' +
  'transition-[border-color,box-shadow] duration-150 ease-brand ' +
  'hover:border-ink-700 focus:border-ink-900 focus:outline-none focus:shadow-[var(--focus-halo)] ' +
  'aria-[invalid=true]:border-error-600 disabled:bg-paper-2 disabled:opacity-60'

export type Common = {
  label: string
  hint?: string
  error?: string
  required?: boolean
  id: string
}

/**
 * The line under a control is always there, so an error replacing a hint (or
 * appearing under a field that had none) never pushes the rest of the form down.
 * `lines` reserves room for hints that wrap on a phone.
 */
export function Message({
  id,
  hint,
  error,
  lines = 1,
}: {
  id: string
  hint?: string
  error?: string
  lines?: 1 | 2
}) {
  return (
    <div className={cn('text-xs leading-5', lines === 2 ? 'min-h-10' : 'min-h-5')}>
      {error ? (
        <p id={`${id}-error`} role="alert" className="enter-fade font-medium text-error-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="enter-fade text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function FieldWrap({
  label,
  hint,
  error,
  required,
  id,
  lines,
  children,
}: Common & { lines?: 1 | 2; children: React.ReactNode }) {
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
      <Message id={id} hint={hint} error={error} lines={lines} />
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
  icon,
  lines,
  ...rest
}: Common & ComponentProps<'input'> & { icon?: ReactNode; lines?: 1 | 2 }) {
  const input = (
    <input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, hint, error)}
      required={required}
      className={cn(control, 'h-11', icon && 'ps-10', className)}
      {...rest}
    />
  )
  return (
    // `lines` for a hint that wraps on a phone: the slot is reserved at its tallest, so an
    // error replacing it never moves the rest of the form.
    <FieldWrap {...{ label, hint, error, required, id, lines }}>
      {icon ? (
        // Same direction as the input, so the icon sits where its text begins.
        <div dir={rest.dir} className="relative">
          {input}
          <span className="pointer-events-none absolute start-3.5 top-1/2 flex -translate-y-1/2 text-ink-500">
            {icon}
          </span>
        </div>
      ) : (
        input
      )}
    </FieldWrap>
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
    <FieldWrap {...{ label, hint, error, required, id }} lines={2}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        // Grows with what is typed (no browser resize grip), within a sane range.
        className={cn(
          control,
          'field-sizing-content max-h-96 min-h-32 resize-none py-2.5',
          className,
        )}
        {...rest}
      />
    </FieldWrap>
  )
}

export function Checkbox({
  label,
  error,
  id,
  required,
  className,
  ...rest
}: { label: React.ReactNode; error?: string; id: string; required?: boolean } & Omit<
  ComponentProps<'input'>,
  'type' | 'required'
>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-start gap-3 text-sm text-ink-700">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          // Marked, not the native attribute: the browser's own bubble would pre-empt the
          // form's error line, like every other field here.
          aria-required={required || undefined}
          className={cn(
            'check-brand mt-1 size-4 shrink-0 cursor-pointer scroll-mt-44 appearance-none rounded-brand border border-line-strong bg-paper transition-[background-color,border-color] duration-150 ease-brand checked:border-red-600 checked:bg-red-600 hover:border-ink-700 focus:outline-none focus-visible:border-ink-900 focus-visible:shadow-[var(--focus-halo)] motion-reduce:transition-none',
            className,
          )}
          {...rest}
        />
        <span>
          {label}
          {required ? (
            <span aria-hidden className="ms-1 text-red-600">
              *
            </span>
          ) : null}
        </span>
      </label>
      <Message id={id} error={error} />
    </div>
  )
}

type Option = { value: string; label: string }

/**
 * A short list of radios under one legend. Spread the result of `register(name)`
 * onto the group; every radio receives it, which is how react-hook-form tracks one
 * value across several inputs.
 */
export function RadioGroup({
  label,
  hint,
  error,
  required,
  id,
  options,
  className,
  defaultValue,
  ...rest
}: Common & { options: Option[]; className?: string } & Omit<
    ComponentProps<'input'>,
    'type' | 'id' | 'children'
  >) {
  // Each radio carries its own `value`, so a `defaultValue` spread across all of them is
  // both meaningless and a React error ("both value and defaultValue"). It selects one
  // instead — which is what anyone passing it meant.
  const preselected = defaultValue === undefined ? undefined : String(defaultValue)
  return (
    <fieldset
      role="radiogroup"
      aria-required={required || undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, hint, error)}
      className={cn('flex min-w-0 flex-col gap-1.5', className)}
    >
      <legend className="text-sm font-medium text-ink-900">
        {label}
        {required ? (
          <span aria-hidden className="ms-1 text-red-600">
            *
          </span>
        ) : null}
      </legend>
      <div className="flex min-h-11 flex-wrap items-center gap-x-6 gap-y-2">
        {options.map((o) => (
          <label
            key={o.value}
            htmlFor={`${id}-${o.value}`}
            className="inline-flex items-center gap-2 text-sm text-ink-700"
          >
            <input
              id={`${id}-${o.value}`}
              type="radio"
              value={o.value}
              defaultChecked={preselected === undefined ? undefined : preselected === o.value}
              className="size-4 shrink-0 cursor-pointer scroll-mt-44 appearance-none rounded-full border border-line-strong bg-paper transition-[border-color,border-width] duration-150 ease-brand checked:border-[5px] checked:border-red-600 hover:border-ink-700 focus:outline-none focus-visible:border-ink-900 focus-visible:shadow-[var(--focus-halo)]"
              {...rest}
            />
            {o.label}
          </label>
        ))}
      </div>
      <Message id={id} hint={hint} error={error} />
    </fieldset>
  )
}

/** Native file input, its button styled as the secondary button. */
