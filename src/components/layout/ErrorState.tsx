'use client'

import { useEffect, useRef } from 'react'
import { Mark } from '@/components/brand/Mark'
import { Button, buttonClass } from '@/components/ui/Button'

export type ErrorCopy = {
  title: string
  body: string
  retry: string
  home: string
  /** Already filled with the digest, or absent when there is none. */
  reference?: string
}

/**
 * What a visitor sees when a page fails to render: the same shape as the not-found page
 * (mark, heading, one line, two ways out), in their language, with the error's digest so a
 * report can be matched to the server log. Focus moves to the heading so a screen reader
 * announces the failure instead of silence.
 *
 * Takes its words as props because `global-error` renders outside the intl provider;
 * `homeHref` is a plain href for the same reason (the locale's root, never a locale-less
 * `/` that would redirect).
 */
export function ErrorState({
  copy,
  homeHref,
  onRetry,
}: {
  copy: ErrorCopy
  homeHref: string
  onRetry: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  return (
    <section className="container-reading flex enter flex-col items-start section-y">
      <Mark size={40} />
      <h1
        ref={heading}
        tabIndex={-1}
        className="mt-8 text-3xl outline-none focus-visible:shadow-none"
      >
        {copy.title}
      </h1>
      <p className="mt-4 measure text-md text-ink-500">{copy.body}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button onClick={onRetry}>{copy.retry}</Button>
        {/* A full navigation, not a client transition: after an error the router's state
            is not worth trusting. */}
        <a href={homeHref} className={buttonClass({ variant: 'secondary' })}>
          {copy.home}
        </a>
      </div>
      {copy.reference ? (
        <p className="mt-10 text-xs text-ink-500">
          <bdi>{copy.reference}</bdi>
        </p>
      ) : null}
    </section>
  )
}
