import { RichText } from '@payloadcms/richtext-lexical/react'
import type {
  JSXConverterArgs,
  JSXConverters,
  JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
import {
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

type LexicalData = ComponentProps<typeof RichText>['data']

/**
 * Lexical stores an element's alignment as one of '', 'left', 'center', 'right', 'justify',
 * 'start', 'end' — and saving a field through the admin stamps `format: 'start'` on every
 * block, whether or not anyone touched the alignment control. Payload's JSX converter then
 * maps the two *logical* values to their LTR physical equivalents
 * (`lexicalToJSX/converter/index.js`: `start` → `text-align: left`, `end` → `right`), so
 * Arabic prose came back from the admin left-aligned on the public page — the paragraph was
 * still RTL, but its lines hugged the wrong edge. Reported 2026-09-24 on
 * `/ar/programs/open-training`, whose intro carried `<p style="text-align:left">`.
 *
 * `start` and `end` are real CSS keywords that resolve against the element's own direction,
 * so the fix is to emit them unchanged. The converter merges an element's own `style` over
 * the one it computed (`{ ...style, ...reactNode.props.style }`), which is what lets a
 * converter override it here. Every node type is wrapped rather than the few that carry a
 * format today, so a feature added to `lexicalEditor()` later cannot reintroduce this.
 *
 * Physical `left`/`right` are left alone: those are a deliberate choice by whoever wrote the
 * content, and they mean the same thing in both locales.
 */
function withLogicalAlignment(converters: JSXConverters): JSXConverters {
  const entries = Object.entries(converters).map(([type, convert]) => {
    if (typeof convert !== 'function') return [type, convert] as const
    const render = convert as (args: JSXConverterArgs) => ReactNode
    const wrapped = (args: JSXConverterArgs) => {
      const rendered = render(args)
      const format = (args.node as { format?: unknown }).format
      if ((format !== 'start' && format !== 'end') || !isValidElement(rendered)) return rendered
      const element = rendered as ReactElement<{ style?: Record<string, unknown> }>
      return cloneElement(element, {
        style: { ...(element.props.style ?? {}), textAlign: format },
      })
    }
    return [type, wrapped] as const
  })
  return Object.fromEntries(entries) as JSXConverters
}

const converters: JSXConvertersFunction = ({ defaultConverters }) =>
  withLogicalAlignment(defaultConverters as JSXConverters)

/** Editorial rich text: measured, generous leading, hairline rules for headings. */
export function Prose({
  data,
  className,
  size = 'base',
}: {
  data: LexicalData | null | undefined
  className?: string
  size?: 'base' | 'md'
}) {
  if (!data) return null
  return (
    <div className={cn('prose-jaa measure text-ink-700', size === 'md' && 'text-md', className)}>
      <RichText converters={converters} data={data} />
    </div>
  )
}
