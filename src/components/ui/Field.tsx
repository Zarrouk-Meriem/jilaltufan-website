import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export const control =
  'w-full rounded-brand border border-line-strong bg-paper px-3.5 text-ink-900 placeholder:text-ink-500 ' +
  'transition-[border-color,box-shadow] duration-150 ease-brand ' +
  'hover:border-ink-700 focus:border-ink-900 focus:outline-none focus:shadow-[var(--focus-ring)] ' +
  'aria-[invalid=true]:border-red-600 disabled:bg-paper-2 disabled:opacity-60'

type Common = { label: string; hint?: string; error?: string; required?: boolean; id: string }

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
        <p id={`${id}-error`} role="alert" className="font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-ink-500">
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
  ...rest
}: Common & ComponentProps<'input'>) {
  return (
    <FieldWrap {...{ label, hint, error, required, id }}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        className={cn(control, 'h-11', className)}
        {...rest}
      />
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
        className={cn(control, 'min-h-32 py-2.5', className)}
        {...rest}
      />
    </FieldWrap>
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
            'mt-1 size-4 shrink-0 rounded-brand accent-red-600 focus:outline-none focus-visible:shadow-[var(--focus-ring)]',
            className,
          )}
          {...rest}
        />
        <span>{label}</span>
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
  ...rest
}: Common & { options: Option[]; className?: string } & Omit<
    ComponentProps<'input'>,
    'type' | 'id' | 'children'
  >) {
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
              className="size-4 shrink-0 cursor-pointer appearance-none rounded-full border border-line-strong bg-paper transition-[border-color,border-width] duration-150 ease-brand checked:border-[5px] checked:border-red-600 hover:border-ink-700 focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
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
export function FileInput({
  label,
  hint,
  error,
  required,
  id,
  className,
  ...rest
}: Common & Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <FieldWrap {...{ label, hint, error, required, id }}>
      <input
        id={id}
        type="file"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        className={cn(
          'block w-full rounded-brand text-sm text-ink-700 focus:shadow-[var(--focus-ring)] focus:outline-none',
          'file:me-3 file:h-10 file:cursor-pointer file:rounded-brand file:border file:border-ink-900 file:bg-transparent file:px-3.5 file:text-sm file:font-medium file:text-ink-900',
          'file:transition-[background-color,color] file:duration-150 file:ease-brand hover:file:bg-ink-900 hover:file:text-white',
          className,
        )}
        {...rest}
      />
    </FieldWrap>
  )
}
