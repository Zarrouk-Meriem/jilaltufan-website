'use client'
import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { usePathname, useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'

const noSubscribe = () => () => {}
/** 'framed' inside the admin's pane, 'top' in a tab of its own; null on the server. */
const whereAmI = () => (window.self !== window.top ? 'framed' : 'top')

/**
 * Rendered only in draft mode (a staff browser that came through `/preview`). Inside the
 * admin's live-preview pane it re-renders the page each time the editor saves or the draft
 * autosaves, so the pane follows the typing. Outside the pane it shows a small bar: this
 * browser is seeing drafts, and one click leaves preview.
 */
export function LivePreview({ label, exitLabel }: { label: string; exitLabel: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const where = useSyncExternalStore(noSubscribe, whereAmI, () => null)
  if (!where) return null
  if (where === 'framed')
    return (
      <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={window.location.origin} />
    )
  return (
    <form
      method="post"
      action={`/preview/exit?path=${encodeURIComponent(pathname)}`}
      className="fixed start-4 bottom-4 z-50 flex enter items-center gap-3 rounded-brand bg-ink-900 px-3 py-2 text-sm text-white shadow-lg"
    >
      <span>{label}</span>
      <button type="submit" className="font-semibold underline underline-offset-2">
        {exitLabel}
      </button>
    </form>
  )
}
