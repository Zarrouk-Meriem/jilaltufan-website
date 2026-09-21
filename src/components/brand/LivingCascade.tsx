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
export function LivingCascade({
  corner = 'far-top',
  className,
}: {
  /** `far-top`: the corner away from the copy, at the top. `near-bottom`: on the copy's side, at the foot, smaller. */
  corner?: 'far-top' | 'near-bottom'
  className?: string
}) {
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
        // The layer may be mirrored or rotated into its corner; map the pointer through
        // the same transform so the light still lands under it.
        const m = /matrix\(([^)]+)\)/.exec(getComputedStyle(el).transform)?.[1]?.split(',')
        const flipX = Number(m?.[0] ?? 1) < 0
        const flipY = Number(m?.[3] ?? 1) < 0
        const x = (e.clientX - r.left) / r.width
        const y = (e.clientY - r.top) / r.height
        el.style.setProperty('--px', `${((flipX ? 1 - x : x) * 100).toFixed(1)}%`)
        el.style.setProperty('--py', `${((flipY ? 1 - y : y) * 100).toFixed(1)}%`)
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
        'living-mark',
        corner === 'far-top'
          ? '[--cascade-size:60vw] [--cascade-x:-22vw] [--cascade-y:-12vw] md:[--cascade-size:72vw] md:[--cascade-x:-18vw] md:[--cascade-y:-11vw]'
          : // A small box in the corner itself (the pattern shows only there, dissolving at
            // the box's inner edges), no idle drift of its own, wide frames only — on a
            // phone it would sit behind the session strip.
            'hidden [--cascade-size:22vw] [--cascade-x:-9vw] [--cascade-y:-4vw] [--mark-flip-ltr:scaleY(-1)] [--mark-flip:rotate(180deg)] md:inset-auto md:start-0 md:bottom-0 md:block md:h-[36%] md:w-[12vw] md:[&>*>*]:[animation:none]',
        className,
      )}
    >
      <div>
        <div />
      </div>
    </div>
  )
}
