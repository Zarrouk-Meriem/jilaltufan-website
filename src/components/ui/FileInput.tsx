'use client'

import { useState, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { FieldWrap, type Common } from './Field'

function describedBy(id: string, hint?: string, error?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined
}

/**
 * The file picker drawn by the site: the native input stays in the page (screen
 * readers, keyboard, Playwright) but is visually hidden; a quiet secondary button
 * opens it and the chosen name sits beside it, in the page's language rather than
 * the browser's.
 */
export function FileInput({
  label,
  hint,
  error,
  required,
  id,
  className,
  chooseLabel,
  emptyLabel,
  onChange,
  ...rest
}: Common & Omit<ComponentProps<'input'>, 'type'> & { chooseLabel: string; emptyLabel: string }) {
  const [fileName, setFileName] = useState('')
  return (
    <FieldWrap {...{ label, hint, error, required, id }}>
      <div className={cn('flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1', className)}>
        <input
          id={id}
          type="file"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          required={required}
          className="peer sr-only"
          onChange={(e) => {
            setFileName(e.target.files?.[0]?.name ?? '')
            onChange?.(e)
          }}
          {...rest}
        />
        <label
          htmlFor={id}
          className="inline-flex h-9 cursor-pointer items-center rounded-brand border border-line-strong bg-paper px-3.5 text-sm text-ink-900 transition-[background-color,border-color] duration-150 ease-brand peer-focus-visible:border-ink-900 peer-focus-visible:shadow-[var(--focus-halo)] hover:border-ink-700 hover:bg-paper-2 motion-reduce:transition-none"
        >
          {chooseLabel}
        </label>
        <span
          key={fileName}
          dir="auto"
          className={cn(
            'min-w-0 enter-fade truncate text-sm',
            fileName ? 'text-ink-900' : 'text-ink-500',
          )}
        >
          {fileName || emptyLabel}
        </span>
      </div>
    </FieldWrap>
  )
}
