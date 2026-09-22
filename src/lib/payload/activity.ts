import type {
  CollectionConfig,
  Field,
  GlobalConfig,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'
import { isStaffUser } from '@/access'
import type { Activity } from '@/payload-types'

/**
 * The activity log: one row per create, update, or delete made by a signed-in staff
 * account, in any collection or global, written from an `afterChange` / `afterDelete`
 * hook. Admins read it as the «Activity log» page; nothing else writes to it.
 *
 * Only people are recorded — the seed, the public forms (no user), and the system's own
 * follow-up writes (`context[SKIP_ACTIVITY]`) are skipped. A failed log write is logged
 * and never blocks the edit itself.
 */
export const ACTIVITY_SLUG = 'activity' as const
/** Set in `context` on a system write (e.g. the status-email stamp) so it is not logged as the editor's. */
export const SKIP_ACTIVITY = 'skipActivity'

export type Action = 'create' | 'update' | 'delete'
export type Label = { ar: string; en: string }
export type Change = { field: string; label: Label; from?: unknown; to?: unknown }

const MAX_TEXT = 120
const MAX_CHANGES = 40
/** Bookkeeping and auth internals: never a change worth recording. */
const IGNORED = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'hash',
  'salt',
  'password',
  'sessions',
  'loginAttempts',
  'lockUntil',
  'resetPasswordToken',
  'resetPasswordExpiration',
  '_verified',
  '_verificationToken',
  'globalType',
])

type Doc = Record<string, unknown>
type Value = unknown

/** A value flattened to what is worth storing: populated relations become ids, long text is cut. */
export function normalise(value: Value): Value {
  if (value === undefined) return null
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'string')
    return value.length > MAX_TEXT ? value.slice(0, MAX_TEXT) + '…' : value
  if (Array.isArray(value)) return value.map(normalise)
  if (typeof value === 'object') {
    const o = value as Doc
    if ('id' in o && Object.keys(o).length > 1 && !('blockType' in o)) return o.id
    // A relationship value can be `{ relationTo, value }`.
    if ('relationTo' in o && 'value' in o) return normalise(o.value)
    const out: Doc = {}
    for (const [k, v] of Object.entries(o)) if (!IGNORED.has(k)) out[k] = normalise(v)
    return out
  }
  return String(value)
}

const isScalar = (v: Value) =>
  v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
/** Short enough to show both sides: a primitive, or a small list of primitives. */
const showable = (v: Value) =>
  isScalar(v) || (Array.isArray(v) && v.length <= 10 && v.every(isScalar))

/** A Payload label (`string` or `{ ar, en }`; functions and elements are not translatable here) as `{ ar, en }`. */
export function toLabel(v: unknown, fallback: string): Label {
  if (typeof v === 'string') return { ar: v, en: v }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>
    const ar = typeof o.ar === 'string' ? o.ar : undefined
    const en = typeof o.en === 'string' ? o.en : undefined
    return { ar: ar ?? en ?? fallback, en: en ?? ar ?? fallback }
  }
  return { ar: fallback, en: fallback }
}

const fieldLabel = (field: Field | undefined, name: string): Label =>
  toLabel(field && 'label' in field ? field.label : undefined, name)

/** Top-level named fields, reaching through tabs, rows, collapsibles, and unnamed groups. */
export function namedFields(fields: Field[]): Map<string, Field> {
  const out = new Map<string, Field>()
  const walk = (list: Field[]) => {
    for (const f of list) {
      if ('name' in f && f.name) out.set(f.name, f)
      else if (f.type === 'tabs') {
        for (const t of f.tabs) {
          if ('name' in t && t.name) out.set(t.name, f)
          else walk(t.fields)
        }
      } else if ('fields' in f) walk(f.fields)
    }
  }
  walk(fields)
  return out
}

/**
 * A select or radio value as its label in one language, so the log reads «مقبول» rather
 * than `accepted`. The log stores raw values; the cell resolves them at render time.
 */
export function optionLabel(field: Field | undefined, value: Value, lang: 'ar' | 'en'): Value {
  if (!field || (field.type !== 'select' && field.type !== 'radio')) return value
  const pick = (v: Value) => {
    const opt = field.options.find((o) => (typeof o === 'string' ? o : o.value) === v)
    if (!opt || typeof opt === 'string') return v
    return toLabel(opt.label, String(v))[lang]
  }
  return Array.isArray(value) ? value.map(pick) : pick(value)
}

/**
 * Which top-level fields differ between two states of a document. Values are kept only when
 * both sides are short and the field has no field-level read restriction (a staff-only
 * field is named, never quoted).
 */
export function diffFields(prev: Doc | undefined, next: Doc, fields: Field[] = []): Change[] {
  const named = namedFields(fields)
  const keys = new Set([...Object.keys(prev ?? {}), ...Object.keys(next)])
  const changes: Change[] = []
  for (const key of keys) {
    if (IGNORED.has(key)) continue
    const a = normalise(prev?.[key])
    const b = normalise(next[key])
    if (JSON.stringify(a) === JSON.stringify(b)) continue
    const field = named.get(key)
    const change: Change = { field: key, label: fieldLabel(field, key) }
    const restricted = !!(field && 'access' in field && field.access?.read)
    if (!restricted && showable(a) && showable(b)) {
      change.from = a
      change.to = b
    }
    changes.push(change)
    if (changes.length >= MAX_CHANGES) break
  }
  return changes
}

/** The document's title as the admin shows it, whatever the collection calls that field. */
export function docTitle(doc: Doc, useAsTitle?: string): string {
  const candidates = [useAsTitle, 'title', 'name', 'fullName', 'subject', 'filename', 'email']
  for (const key of candidates) {
    const v = key ? doc[key] : undefined
    if (typeof v === 'string' && v.trim()) return v.slice(0, MAX_TEXT)
    if (v && typeof v === 'object') {
      const l = v as Doc
      const s = l.ar ?? l.en
      if (typeof s === 'string' && s.trim()) return s.slice(0, MAX_TEXT)
    }
  }
  return doc.id != null ? `#${String(doc.id)}` : ''
}

type Entry = {
  action: Action
  target: Activity['target']
  docId?: string
  title: string
  changes: Change[]
}

async function record(req: PayloadRequest, entry: Entry): Promise<void> {
  if (!isStaffUser(req) || req.context?.[SKIP_ACTIVITY]) return
  const user = req.user as { id: number; email?: string }
  try {
    await req.payload.create({
      collection: ACTIVITY_SLUG,
      data: {
        ...entry,
        docId: entry.docId ?? null,
        user: user.id,
        userEmail: user.email ?? '',
        locale: typeof req.locale === 'string' ? req.locale : null,
        changes: entry.changes,
      },
      req,
      overrideAccess: true,
      depth: 0,
    })
  } catch (err) {
    req.payload.logger.error({ msg: 'activity log write failed', entry, err })
  }
}

/** Adds the activity hooks to a collection. Applied to every collection but the log itself. */
export function logActivity(collection: CollectionConfig): CollectionConfig {
  if (collection.slug === ACTIVITY_SLUG) return collection
  const afterChange: NonNullable<CollectionConfig['hooks']>['afterChange'] = [
    async ({ doc, previousDoc, operation, req, collection: c }) => {
      const cfg = c as SanitizedCollectionConfig
      const prev = operation === 'create' ? undefined : (previousDoc as Doc | undefined)
      await record(req, {
        action: operation,
        target: cfg.slug as Activity['target'],
        docId: String(doc.id),
        title: docTitle(doc as Doc, cfg.admin?.useAsTitle),
        changes: operation === 'create' ? [] : diffFields(prev, doc as Doc, cfg.fields),
      })
      return doc
    },
  ]
  const afterDelete: NonNullable<CollectionConfig['hooks']>['afterDelete'] = [
    async ({ doc, id, req, collection: c }) => {
      const cfg = c as SanitizedCollectionConfig
      await record(req, {
        action: 'delete',
        target: cfg.slug as Activity['target'],
        docId: String(id),
        title: docTitle((doc ?? {}) as Doc, cfg.admin?.useAsTitle),
        changes: [],
      })
      return doc
    },
  ]
  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      afterChange: [...(collection.hooks?.afterChange ?? []), ...afterChange],
      afterDelete: [...(collection.hooks?.afterDelete ?? []), ...afterDelete],
    },
  }
}

/** Adds the activity hook to a global: every save is an update of the one document. */
export function logGlobalActivity(global: GlobalConfig): GlobalConfig {
  const afterChange: NonNullable<GlobalConfig['hooks']>['afterChange'] = [
    async ({ doc, previousDoc, req, global: g }) => {
      const cfg = g as SanitizedGlobalConfig
      await record(req, {
        action: 'update',
        target: cfg.slug as Activity['target'],
        title: toLabel(cfg.label, cfg.slug).ar,
        changes: diffFields(previousDoc as Doc | undefined, doc as Doc, cfg.fields),
      })
      return doc
    },
  ]
  return {
    ...global,
    hooks: { ...global.hooks, afterChange: [...(global.hooks?.afterChange ?? []), ...afterChange] },
  }
}

/** `{ value: slug, label }` for the log's target field, in sidebar order. */
export function targetOptions(collections: CollectionConfig[], globals: GlobalConfig[]) {
  return [
    ...collections.map((c) => ({
      value: c.slug,
      label: toLabel(c.labels?.singular, c.slug),
    })),
    ...globals.map((g) => ({
      value: g.slug,
      label: toLabel(g.label, g.slug),
    })),
  ]
}
