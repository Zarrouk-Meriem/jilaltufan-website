import type { Material } from '@/payload-types'
import { rel } from '@/lib/relations'

/**
 * Where a material's file is downloaded from: its own upload in the media library, or —
 * when staff published an instructor's file — that file where it was sent. One place, so
 * every list links a published instructor file the same way.
 */
export function materialFileUrl(m: Material): string | undefined {
  return rel(m.file)?.url ?? rel(m.sessionFile)?.url ?? undefined
}
