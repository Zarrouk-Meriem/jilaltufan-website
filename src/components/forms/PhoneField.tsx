'use client'

import { useState, type Ref } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { control, FieldWrap } from '@/components/ui/Field'
import { formatNational, splitE164, toE164, type DialOption } from '@/lib/dial-codes'
import { cn } from '@/lib/cn'

const fallbackFor = (options: DialOption[], c?: string) =>
  c && options.some((o) => o.value === c) ? c : ''

/**
 * Country (flag + calling code) beside the national number, the way phone fields are
 * usually built, on the site's own combobox. libphonenumber groups the digits as the
 * visitor types and produces the stored E.164 value (`+21620000000`) that the hidden
 * input carries. Until the visitor picks a country, it follows `defaultCountry`
 * (residence, then nationality), so most never touch it.
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
  value = '',
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
  /** The form's value (E.164); when it changes from outside, the controls follow it. */
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  inputRef?: Ref<HTMLInputElement>
  defaultCountry?: string
  placeholder?: string
  noResultsLabel: string
}) {
  const [chosen, setChosen] = useState('')
  const [number, setNumber] = useState('')
  // Derived-state pattern: when the form hands us a value we did not emit (a restored
  // draft), split it into country and national number once.
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (value && value !== toE164(number, chosen || fallbackFor(options, defaultCountry))) {
      const parts = splitE164(value)
      if (parts) {
        setChosen(parts.country)
        setNumber(formatNational(parts.national, parts.country))
      }
    }
  }
  const fallback = fallbackFor(options, defaultCountry)
  const country = chosen || fallback
  const stored = toE164(number, country)

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
            const next = formatNational(number, v)
            setNumber(next)
            onChange(toE164(next, v))
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
            const next = formatNational(e.target.value, country)
            setNumber(next)
            onChange(toE164(next, country))
          }}
          onBlur={() => {
            // The country may have followed the residence field since the last keystroke.
            onChange(toE164(number, country))
            onBlur?.()
          }}
          className={cn(control, 'h-11 min-w-0 flex-1')}
        />
        <input type="hidden" name={name} value={stored} />
      </div>
    </FieldWrap>
  )
}
