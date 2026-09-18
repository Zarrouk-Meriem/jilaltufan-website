import type { ApplyInput } from './apply-schema'

/**
 * The application draft lives in the visitor's browser (localStorage) so a reload, a
 * closed tab, or a lost connection never costs them what they typed. It is cleared
 * the moment the application is sent, and expires on its own after three days.
 * Never stored: the CV (a file), the two consent boxes (given afresh each time), and
 * the anti-spam fields.
 */
const KEY = 'jaa:apply-draft:v1'
const TTL_MS = 3 * 24 * 60 * 60 * 1000

export const DRAFT_FIELDS = [
  'fullName',
  'gender',
  'dateOfBirth',
  'email',
  'phone',
  'nationality',
  'country',
  'profession',
  'affiliated',
  'affiliationName',
  'facebook',
  'instagram',
  'linkedin',
  'hearAbout',
  'motivation',
  'aboutYou',
] as const satisfies readonly (keyof ApplyInput)[]

export type DraftValues = Partial<Pick<ApplyInput, (typeof DRAFT_FIELDS)[number]>>
export type Draft = { step: number; values: DraftValues; savedAt: number }

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null // private mode, blocked storage
  }
}

export function readDraft(now = Date.now()): Draft | null {
  const s = storage()
  if (!s) return null
  try {
    const raw = s.getItem(KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as Draft
    if (!d || typeof d !== 'object' || !d.values || now - (d.savedAt ?? 0) > TTL_MS) {
      s.removeItem(KEY)
      return null
    }
    return d
  } catch {
    return null
  }
}

/** Keep only the draft fields, only when something was actually typed. */
export function toDraftValues(values: Partial<ApplyInput>): DraftValues {
  const out: DraftValues = {}
  for (const k of DRAFT_FIELDS) {
    const v = values[k]
    if (typeof v === 'string' && v.trim()) (out as Record<string, string>)[k] = v
  }
  return out
}

export function writeDraft(step: number, values: Partial<ApplyInput>, now = Date.now()) {
  const s = storage()
  if (!s) return
  const draft: Draft = { step, values: toDraftValues(values), savedAt: now }
  try {
    if (Object.keys(draft.values).length === 0) s.removeItem(KEY)
    else s.setItem(KEY, JSON.stringify(draft))
  } catch {
    // quota or blocked storage: the form still works without a draft
  }
}

export function clearDraft() {
  try {
    storage()?.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}
