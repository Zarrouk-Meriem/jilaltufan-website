import { cn } from '@/lib/cn'

export type StepDef = { title: string; hint?: string }

/**
 * Progress for a multi-step form. State is shown by the top rule and by weight
 * (red for the current step, ink for a finished one, hairline ahead), never by the
 * mark. Finished steps are buttons, so a visitor can go back and edit.
 */
export function Stepper({
  steps,
  current,
  label,
  stepLabel,
  onSelect,
}: {
  steps: StepDef[]
  current: number
  /** Accessible name of the list. */
  label: string
  /** "Step n of total" for assistive tech. */
  stepLabel: (n: number, total: number) => string
  onSelect?: (index: number) => void
}) {
  return (
    <ol aria-label={label} className="grid grid-cols-3 gap-3 sm:gap-4">
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'ahead'
        const inner = (
          <>
            <span className="sr-only">{stepLabel(i + 1, steps.length)} · </span>
            <span
              aria-hidden
              className={cn(
                'block text-xs tabular-nums',
                state === 'current' ? 'text-red-700' : 'text-ink-500',
              )}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className={cn(
                'mt-1 block text-sm leading-snug',
                state === 'current' && 'font-semibold text-ink-900',
                state === 'done' && 'text-ink-900',
                state === 'ahead' && 'text-ink-500',
              )}
            >
              {s.title}
            </span>
            {s.hint ? (
              <span className="mt-0.5 hidden text-xs text-ink-500 sm:block">{s.hint}</span>
            ) : null}
          </>
        )
        const rule = cn(
          'block w-full border-t-2 pt-3 text-start transition-colors duration-200 ease-brand',
          state === 'current' && 'border-red-600',
          state === 'done' && 'border-ink-900',
          state === 'ahead' && 'border-line',
        )
        return (
          <li key={i} aria-current={state === 'current' ? 'step' : undefined}>
            {state === 'done' && onSelect ? (
              <button type="button" onClick={() => onSelect(i)} className={cn(rule, 'group')}>
                {inner}
              </button>
            ) : (
              <div className={rule}>{inner}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
