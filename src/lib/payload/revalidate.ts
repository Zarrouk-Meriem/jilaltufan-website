import { revalidatePath } from 'next/cache'
import type { CollectionConfig, GlobalConfig } from 'payload'

/**
 * Public pages are ISR (60 s to an hour). Without this, a published edit reached visitors only
 * when the page's timer ran out (user report, 2026-09-26: «no real-time change»). A publish of
 * public content refreshes every cached page at once; an autosaved draft does not. Outside a
 * Next request (the seed, a script) there is no cache to refresh, so the call is skipped.
 */
function refreshSite() {
  try {
    revalidatePath('/', 'layout')
  } catch {
    // not inside a Next request
  }
}
const isDraft = (doc: unknown) => (doc as { _status?: string } | null)?._status === 'draft'

export function revalidateOnChange(collection: CollectionConfig): CollectionConfig {
  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      afterChange: [
        ...(collection.hooks?.afterChange ?? []),
        ({ doc }) => {
          if (!isDraft(doc)) refreshSite()
          return doc
        },
      ],
      afterDelete: [
        ...(collection.hooks?.afterDelete ?? []),
        ({ doc }) => {
          refreshSite()
          return doc
        },
      ],
    },
  }
}

export function revalidateGlobalOnChange(global: GlobalConfig): GlobalConfig {
  return {
    ...global,
    hooks: {
      ...global.hooks,
      afterChange: [
        ...(global.hooks?.afterChange ?? []),
        ({ doc }) => {
          if (!isDraft(doc)) refreshSite()
          return doc
        },
      ],
    },
  }
}
