'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * The hero's art: the designer's cascade of interlocking marks, large, at the
 * top-left corner and bleeding out of the frame, lit by a gradient that follows
 * the pointer. The cascade is a mask; the gradient's centre is --px/--py on this element, set
 * from `pointermove` on the parent surface (this layer takes no events); the light
 * moves by transform only (`living-mark` in `patterns.css`). A client leaf
 * only because of the listener; it renders nothing for assistive tech.
 */
export function LivingCascade({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    const host = el?.parentElement
    if (!el || !host) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height) return
        // Mirrored in LTR (the art sits top-right there), so mirror the pointer too.
        const x = (e.clientX - r.left) / r.width
        const px = getComputedStyle(el).direction === 'ltr' ? 1 - x : x
        el.style.setProperty('--px', `${(px * 100).toFixed(1)}%`)
        el.style.setProperty('--py', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
      })
    }
    const onLeave = () => {
      el.style.removeProperty('--px')
      el.style.removeProperty('--py')
    }
    host.addEventListener('pointermove', onMove, { passive: true })
    host.addEventListener('pointerleave', onLeave)
    return () => {
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        'living-mark [--cascade-size:60vw] [--cascade-x:-22vw] [--cascade-y:-12vw] md:[--cascade-size:72vw] md:[--cascade-x:-18vw] md:[--cascade-y:-11vw]',
        className,
      )}
    >
      <div>
        <div />
      </div>
    </div>
  )
}
