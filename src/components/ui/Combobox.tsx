'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type Ref } from 'react'
import { cn } from '@/lib/cn'
import { control, FieldWrap } from './Field'

/** `short` is what the closed control shows when it differs from the list row. */
export type ComboboxOption = { value: string; label: string; short?: string; flag?: string }

/** A country flag from flag-icons (4:3, SVG), decorative next to the name. */
const Flag = ({ code }: { code: string }) => (
  <span aria-hidden className={`fi fi-${code} shrink-0 rounded-[1px] text-[1.1em]`} />
)

/** Loose matching for typed text: no case, no tashkeel, one alef for all its forms. */
function fold(s: string) {
  return s
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
}

/**
 * A select drawn by the site, not the OS: an input that opens a brand-styled list,
 * filters as the visitor types (`searchable`), and follows the ARIA combobox pattern
 * (arrow keys, Home/End, Enter, Escape, active-descendant). The chosen value travels
 * in a hidden input so a plain FormData submission carries it.
 */
export function Combobox({
  id,
  name,
  label,
  options,
  value,
  onChange,
  onBlur,
  inputRef,
  placeholder,
  noResultsLabel,
  hint,
  error,
  required,
  searchable = true,
  bare = false,
  ariaLabel,
  className,
}: {
  id: string
  /** FormData key of the hidden input; omit when a parent carries the value itself. */
  name?: string
  label?: string
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  inputRef?: Ref<HTMLInputElement>
  placeholder?: string
  noResultsLabel: string
  hint?: string
  error?: string
  required?: boolean
  searchable?: boolean
  /** Only the control, no label or message line (for composite fields). */
  bare?: boolean
  ariaLabel?: string
  className?: string
}) {
  const listId = `${useId()}-list`
  const [open, setOpen] = useState(false)
  /** Text the visitor is typing; null shows the chosen option's label instead. */
  const [query, setQuery] = useState<string | null>(null)
  const [active, setActive] = useState(-1)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = options.find((o) => o.value === value)
  const filtered = useMemo(() => {
    if (!searchable || query === null || !query.trim()) return options
    const q = fold(query)
    // Names that start with the typed text come first, then the ones that contain it.
    const starts: ComboboxOption[] = []
    const contains: ComboboxOption[] = []
    for (const o of options) {
      const l = fold(o.label)
      if (l.startsWith(q)) starts.push(o)
      else if (l.includes(q)) contains.push(o)
    }
    return [...starts, ...contains]
  }, [options, query, searchable])

  const close = () => {
    setOpen(false)
    setQuery(null)
    setActive(-1)
  }
  const show = (at?: number) => {
    setOpen(true)
    const i =
      at ??
      Math.max(
        0,
        filtered.findIndex((o) => o.value === value),
      )
    setActive(i)
  }
  const choose = (o: ComboboxOption) => {
    onChange(o.value)
    close()
  }

  // Keep the active option in view while arrowing through a long list.
  useEffect(() => {
    if (!open || active < 0) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) show()
        else setActive((i) => Math.min(filtered.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) show()
        else setActive((i) => Math.max(0, i - 1))
        break
      case 'Home':
        if (open) {
          e.preventDefault()
          setActive(0)
        }
        break
      case 'End':
        if (open) {
          e.preventDefault()
          setActive(filtered.length - 1)
        }
        break
      case 'Enter':
        if (open) {
          e.preventDefault()
          const o = filtered[active]
          if (o) choose(o)
        }
        break
      case 'Escape':
        if (open) {
          e.preventDefault()
          close()
        }
        break
      case 'Tab':
        if (open) close()
        break
      default:
        if (!searchable && e.key === ' ') {
          e.preventDefault()
          if (!open) show()
        }
    }
  }

  const hasFlags = options.some((o) => o.flag)
  const body = (
    <div className={cn('relative', className)}>
      {/* Static copy of flag-icons (scripts/sync-flags.mjs); React hoists the link to <head>. */}
      {hasFlags ? (
        // eslint-disable-next-line @next/next/no-css-tags -- a static file on purpose (scripts/sync-flags.mjs)
        <link rel="stylesheet" precedence="default" href="/flags/flag-icons.css" />
      ) : null}
      <input
        id={id}
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete={searchable ? 'list' : 'none'}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-required={required || undefined}
        aria-label={ariaLabel}
        autoComplete="off"
        readOnly={!searchable}
        placeholder={placeholder}
        value={query ?? selected?.short ?? selected?.label ?? ''}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => {
          if (!searchable) show()
        }}
        onClick={() => {
          if (!open) show()
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          close()
          onBlur?.()
        }}
        className={cn(
          control,
          'h-11 pe-10',
          !searchable && 'cursor-pointer',
          selected?.flag && query === null && 'ps-10',
        )}
      />
      {selected?.flag && query === null ? (
        <span className="pointer-events-none absolute start-3.5 top-1/2 flex -translate-y-1/2">
          <Flag code={selected.flag} />
        </span>
      ) : null}
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <ChevronDown
        aria-hidden
        strokeWidth={1.5}
        className={cn(
          'pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-700 transition-transform duration-200 ease-brand motion-reduce:transition-none',
          open && 'rotate-180',
        )}
      />
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        hidden={!open}
        className="absolute start-0 end-0 top-full z-20 mt-1 max-h-64 enter overflow-y-auto rounded-brand border border-line-strong bg-paper py-1 shadow-[0_12px_32px_rgb(5_7_8_/_0.12)]"
      >
        {filtered.length ? (
          filtered.map((o, i) => {
            const isSelected = o.value === value
            return (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                // mousedown, not click: the input must keep focus so blur does not close
                // the list before the choice lands.
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(o)
                }}
                onMouseMove={() => setActive(i)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2 text-sm text-ink-900',
                  i === active && 'bg-paper-2',
                  isSelected && 'font-medium',
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {o.flag ? <Flag code={o.flag} /> : null}
                  <span className="truncate">{o.label}</span>
                </span>
                {isSelected ? (
                  <Check aria-hidden strokeWidth={2} className="size-4 shrink-0 text-red-600" />
                ) : null}
              </li>
            )
          })
        ) : (
          <li className="px-3.5 py-2 text-sm text-ink-500" role="presentation">
            {noResultsLabel}
          </li>
        )}
      </ul>
    </div>
  )
  if (bare) return body
  return <FieldWrap {...{ label: label ?? '', hint, error, required, id }}>{body}</FieldWrap>
}
