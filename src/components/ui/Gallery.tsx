'use client'

import { Icon } from '@/components/icons/Icon'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

export type GalleryImage = {
  url: string
  alt: string
  width?: number | null
  height?: number | null
}

/**
 * Untreated photo grid (camp gallery) with a keyboard-accessible lightbox:
 * native <dialog>, focus trapped by the platform, Escape closes, arrows move.
 */
export function Gallery({
  images,
  labels,
}: {
  images: GalleryImage[]
  labels: { open: (n: number, total: number) => string; close: string; prev: string; next: string }
}) {
  const [index, setIndex] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)

  const close = useCallback(() => {
    dialog.current?.close()
    setIndex(null)
    openerRef.current?.focus()
  }, [])

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (index !== null && !d.open) d.showModal()
    const onKey = (e: KeyboardEvent) => {
      if (index === null) return
      if (e.key === 'ArrowRight') setIndex((i) => (i === null ? i : (i + 1) % images.length))
      if (e.key === 'ArrowLeft')
        setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, images.length])

  const current = index !== null ? images[index] : null

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((img, i) => (
          <li key={img.url}>
            <button
              type="button"
              aria-label={labels.open(i + 1, images.length)}
              onClick={(e) => {
                openerRef.current = e.currentTarget
                setIndex(i)
              }}
              className="group block w-full overflow-hidden rounded-brand bg-paper-2 focus-visible:shadow-[var(--focus-ring)] focus-visible:outline-none"
            >
              <Image
                src={img.url}
                alt={img.alt}
                width={img.width ?? 800}
                height={img.height ?? 600}
                sizes="(min-width: 768px) 33vw, 50vw"
                className="aspect-[4/3] w-full object-cover transition-transform duration-200 ease-brand group-hover:scale-[1.02] motion-reduce:transition-none"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => {
          setIndex(null)
          openerRef.current?.focus()
        }}
        aria-label={current?.alt}
        className={cn(
          'm-auto max-h-[100dvh] max-w-[100vw] bg-transparent p-0 backdrop:bg-navy-900/95',
          index === null && 'hidden',
        )}
      >
        {current ? (
          <div className="relative flex h-dvh w-screen items-center justify-center p-4 md:p-10">
            <Image
              src={current.url}
              alt={current.alt}
              width={current.width ?? 1600}
              height={current.height ?? 1200}
              sizes="100vw"
              className="max-h-[85dvh] w-auto max-w-full object-contain"
            />
            <p className="absolute start-4 end-4 bottom-4 text-center text-sm text-on-navy-muted">
              {current.alt}
            </p>
            <button
              type="button"
              aria-label={labels.close}
              onClick={close}
              className="absolute end-4 top-4 inline-flex size-11 items-center justify-center rounded-brand text-on-navy hover:bg-white/10"
            >
              <Icon name="close" />
            </button>
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label={labels.prev}
                  onClick={() =>
                    setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length))
                  }
                  className="absolute start-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-brand text-on-navy hover:bg-white/10"
                >
                  <Icon name="chevron" direction="forward" />
                </button>
                <button
                  type="button"
                  aria-label={labels.next}
                  onClick={() => setIndex((i) => (i === null ? i : (i + 1) % images.length))}
                  className="absolute end-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-brand text-on-navy hover:bg-white/10"
                >
                  <Icon name="chevron" direction="back" />
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  )
}
