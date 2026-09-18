'use client'

import { useState, type Ref } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { control, FieldWrap } from '@/components/ui/Field'
import { formatNational, toE164, type DialOption } from '@/lib/dial-codes'
import { cn } from '@/lib/cn'

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
          className="w-32 shrink-0"
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
