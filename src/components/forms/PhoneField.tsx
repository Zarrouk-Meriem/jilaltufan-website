'use client'

import { useState, type Ref } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { control, FieldWrap } from '@/components/ui/Field'
import type { DialOption } from '@/lib/dial-codes'
import { cn } from '@/lib/cn'

const digitsOnly = (s: string) => s.replace(/[^\d٠-٩۰-۹]/g, '')

/**
 * Country code + national number as one field. What the form receives, and what the
 * hidden input carries, is the joined value `+216 20000000`. Until the visitor picks a
 * code, it follows `defaultCountry` (residence, then nationality), so most never touch it.
 */
export function PhoneField({
  id,
  name,
  label,
  codeLabel,
  hint,
  error,
  required,
  options,
  onChange,
  onBlur,
  inputRef,
  defaultCountry,
  placeholder,
  noResultsLabel,
}: {
  id: string
  name: string
  label: string
  codeLabel: string
  hint?: string
  error?: string
  required?: boolean
  options: DialOption[]
  onChange: (value: string) => void
  onBlur?: () => void
  inputRef?: Ref<HTMLInputElement>
  defaultCountry?: string
  placeholder?: string
  noResultsLabel: string
}) {
  const [chosen, setChosen] = useState('')
  const [number, setNumber] = useState('')
  const fallback = options.some((o) => o.value === defaultCountry) ? defaultCountry! : ''
  const country = chosen || fallback
  const code = options.find((o) => o.value === country)?.short ?? ''
  const joined = (c: string, n: string) => {
    const d = digitsOnly(n)
    return d ? (c ? `${c} ${d}` : d) : ''
  }

  return (
    <FieldWrap {...{ label, hint, error, required, id }}>
      <div className="flex gap-2">
        <Combobox
          bare
          id={`${id}-code`}
          ariaLabel={codeLabel}
          options={options}
          value={country}
          onChange={(v) => {
            setChosen(v)
            onChange(joined(options.find((o) => o.value === v)?.short ?? '', number))
          }}
          placeholder="+"
          noResultsLabel={noResultsLabel}
          error={error}
          className="w-36 shrink-0"
        />
        <input
          id={id}
          ref={inputRef}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          dir="ltr"
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          required={required}
          value={number}
          onChange={(e) => {
            setNumber(e.target.value)
            onChange(joined(code, e.target.value))
          }}
          onBlur={() => {
            // The code may have followed the country since the last keystroke.
            onChange(joined(code, number))
            onBlur?.()
          }}
          className={cn(control, 'h-11 min-w-0 flex-1')}
        />
        <input type="hidden" name={name} value={joined(code, number)} />
      </div>
    </FieldWrap>
  )
}
