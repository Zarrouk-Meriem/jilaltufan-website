'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

/** Fade-up 8px once on first view. Under reduced motion the CSS makes this a no-op. */
export function Reveal({
  children,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'li'
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            el.classList.add('reveal-in')
            io.disconnect()
          }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const C = Tag as any
  return (
    <C ref={ref} className={cn('reveal', className)}>
      {children}
    </C>
  )
}
