import { RichText } from '@payloadcms/richtext-lexical/react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

type LexicalData = ComponentProps<typeof RichText>['data']

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
      <RichText data={data} />
    </div>
  )
}
