import { DuotoneImage } from '@/components/ui/DuotoneImage'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

/** Portrait over a navy backdrop (reference 06), name, role. Quiet by design. */
export function InstructorCard({
  href,
  name,
  role,
  photo,
  className,
}: {
  href?: string
  name: string
  role?: string | null
  photo?: { url: string; alt: string; width?: number | null; height?: number | null } | null
  className?: string
}) {
  const body = (
    <>
      <span className="block aspect-[4/5] w-full overflow-hidden rounded-brand surface-navy">
        {photo ? (
          <DuotoneImage
            src={photo.url}
            alt={photo.alt}
            width={photo.width ?? 600}
            height={photo.height ?? 750}
            className="h-full w-full"
            sizes="(min-width: 768px) 25vw, 50vw"
          />
        ) : null}
      </span>
      <span className="mt-4 block text-md font-semibold text-ink-900">{name}</span>
      {role ? (
        <span className="mt-1 block border-s-2 border-red-600 ps-2 text-sm text-ink-500">
          {role}
        </span>
      ) : null}
    </>
  )
  return href ? (
    <Link href={href as never} className={cn('group block', className)}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}
