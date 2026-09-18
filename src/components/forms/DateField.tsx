'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState, type Ref } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { FieldWrap } from '@/components/ui/Field'

const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const

/**
 * A date of birth as day · month · year, each a site combobox: no OS calendar, and no
 * paging back through decades. The joined value is ISO `YYYY-MM-DD`, carried by a
 * hidden input and handed to the form; incomplete choices hand over an empty string.
 */
export function DateField({
  id,
  name,
  label,
  labels,
  hint,
  error,
  required,
  value,
  onChange,
  onBlur,
  inputRef,
  noResultsLabel,
  minAge = 10,
  maxAge = 100,
}: {
  id: string
  name: string
  label: string
  labels: { day: string; month: string; year: string }
  hint?: string
  error?: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  inputRef?: Ref<HTMLInputElement>
  noResultsLabel: string
  minAge?: number
  maxAge?: number
}) {
  const t = useTranslations('common')
  const locale = useLocale()
  // Each part is kept here: the joined value only exists once all three are chosen.
  const [initY = '', initM = '', initD = ''] = value.split('-')
  const [y, setY] = useState(initY)
  const [m, setM] = useState(initM)
  const [d, setD] = useState(initD)
  // A value handed in from outside (a restored draft) replaces the parts once.
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (value && value !== (y && m && d ? `${y}-${m}-${d}` : '')) {
      setY(initY)
      setM(initM)
      setD(initD)
    }
  }
  const number = useMemo(
    () => new Intl.NumberFormat(locale, { numberingSystem: 'latn', useGrouping: false }),
    [locale],
  )

  const days = useMemo(
    () =>
      Array.from({ length: 31 }, (_, i) => {
        const v = String(i + 1).padStart(2, '0')
        return { value: v, label: number.format(i + 1) }
      }),
    [number],
  )
  const months = useMemo(
    () =>
      MONTH_KEYS.map((k, i) => ({
        value: String(i + 1).padStart(2, '0'),
        label: t(`months.${k}`),
      })),
    [t],
  )
  const years = useMemo(() => {
    const now = new Date().getFullYear()
    return Array.from({ length: maxAge - minAge + 1 }, (_, i) => {
      const v = String(now - minAge - i)
      return { value: v, label: number.format(Number(v)) }
    })
  }, [number, minAge, maxAge])

  const emit = (yy: string, mm: string, dd: string) =>
    onChange(yy && mm && dd ? `${yy}-${mm}-${dd}` : '')

  return (
    <FieldWrap {...{ label, hint, error, required, id }}>
      <div className="grid grid-cols-[1fr_1.4fr_1.1fr] gap-2">
        <Combobox
          bare
          id={`${id}-day`}
          ariaLabel={labels.day}
          options={days}
          value={d}
          onChange={(v) => {
            setD(v)
            emit(y, m, v)
          }}
          onBlur={onBlur}
          inputRef={inputRef}
          placeholder={labels.day}
          noResultsLabel={noResultsLabel}
          error={error}
        />
        <Combobox
          bare
          id={`${id}-month`}
          ariaLabel={labels.month}
          options={months}
          value={m}
          onChange={(v) => {
            setM(v)
            emit(y, v, d)
          }}
          onBlur={onBlur}
          placeholder={labels.month}
          noResultsLabel={noResultsLabel}
          error={error}
        />
        <Combobox
          bare
          id={`${id}-year`}
          ariaLabel={labels.year}
          options={years}
          value={y}
          onChange={(v) => {
            setY(v)
            emit(v, m, d)
          }}
          onBlur={onBlur}
          placeholder={labels.year}
          noResultsLabel={noResultsLabel}
          error={error}
        />
        <input id={id} type="hidden" name={name} value={value} />
      </div>
    </FieldWrap>
  )
}
