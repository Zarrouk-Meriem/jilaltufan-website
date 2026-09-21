import { cn } from '@/lib/cn'

/**
 * The designer's gradient cascade as a living surface: outlined marks, seamless,
 * with a slow-drifting red → blue → navy gradient glowing through them (the glow is
 * a soft halo in the mask) and a radial feather that dissolves the field into the navy around it. Decorative,
 * hidden from assistive tech, sits under the content of a `relative` navy
 * surface. Styles in `src/styles/patterns.css` (`cascade-live`).
 */
export function LivingCascade({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'cascade-live [--cascade-x:80%] rtl:[--cascade-x:20%]',
        // Phones: a smaller field, high on the far side, clear of the copy.
        '[--cascade-h:52%] [--cascade-w:95%] [--cascade-y:28%] md:[--cascade-h:88%] md:[--cascade-w:72%] md:[--cascade-y:60%]',
        className,
      )}
    >
      <div />
    </div>
  )
}
