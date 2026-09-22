import type { Field } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import {
  SKIP_ACTIVITY,
  diffFields,
  docTitle,
  logActivity,
  logGlobalActivity,
  namedFields,
  normalise,
  optionLabel,
  targetOptions,
} from '@/lib/payload/activity'

const fields: Field[] = [
  { name: 'title', type: 'text', label: { ar: 'العنوان', en: 'Title' } },
  {
    name: 'status',
    type: 'select',
    label: { ar: 'الحالة', en: 'Status' },
    options: [
      { value: 'draft', label: { ar: 'مسودّة', en: 'Draft' } },
      { value: 'published', label: { ar: 'منشور', en: 'Published' } },
    ],
  },
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Zoom',
        fields: [
          { name: 'zoomPasscode', type: 'text', label: 'Passcode', access: { read: () => false } },
        ],
      },
    ],
  },
  { name: 'body', type: 'richText', label: 'Body' },
]

describe('activity — diffFields', () => {
  it('names each changed field with its label and keeps short values raw', () => {
    const changes = diffFields(
      { title: 'a', status: 'draft', updatedAt: '1' },
      { title: 'b', status: 'published', updatedAt: '2' },
      fields,
    )
    expect(changes).toEqual([
      { field: 'title', label: { ar: 'العنوان', en: 'Title' }, from: 'a', to: 'b' },
      { field: 'status', label: { ar: 'الحالة', en: 'Status' }, from: 'draft', to: 'published' },
    ])
  })
  it('resolves a select value to its label in either language at render time', () => {
    const status = namedFields(fields).get('status')
    expect(optionLabel(status, 'draft', 'ar')).toBe('مسودّة')
    expect(optionLabel(status, 'draft', 'en')).toBe('Draft')
    expect(optionLabel(status, 'unknown', 'en')).toBe('unknown')
    expect(optionLabel(namedFields(fields).get('title'), 'x', 'en')).toBe('x')
  })
  it('ignores bookkeeping and auth internals', () => {
    expect(
      diffFields(
        { hash: 'x', salt: 'y', updatedAt: '1', id: 1 },
        { hash: 'z', salt: 'w', updatedAt: '2', id: 1 },
      ),
    ).toEqual([])
  })
  it('names a field with a read restriction but never quotes its value', () => {
    const c = diffFields({ zoomPasscode: '1234' }, { zoomPasscode: '9999' }, fields)[0]!
    expect(c.field).toBe('zoomPasscode')
    expect('from' in c).toBe(false)
    expect('to' in c).toBe(false)
  })
  it('names a rich-text field without values, and flattens populated relations to ids', () => {
    const changes = diffFields(
      { body: { root: { children: [] } }, program: { id: 3, title: 'x' } },
      { body: { root: { children: [{ type: 'p' }] } }, program: 4 },
      fields,
    )
    expect(changes).toEqual([
      { field: 'body', label: { ar: 'Body', en: 'Body' } },
      { field: 'program', label: { ar: 'program', en: 'program' }, from: 3, to: 4 },
    ])
  })
  it('records nothing when nothing changed', () => {
    expect(diffFields({ title: 'a' }, { title: 'a', updatedAt: 'now' })).toEqual([])
  })
  it('compares the whole text and clips only what it stores', () => {
    const base = 'x'.repeat(1200)
    const [c] = diffFields({ title: base + 'a' }, { title: base + 'b' }, fields)
    expect(c?.field).toBe('title')
    expect((c?.to as string).length).toBe(1001)
    expect((c?.to as string).endsWith('…')).toBe(true)
    expect(normalise('x'.repeat(1200))).toHaveLength(1200)
  })
  it('reaches named fields through tabs', () => {
    expect([...namedFields(fields).keys()]).toEqual(['title', 'status', 'zoomPasscode', 'body'])
  })
})

describe('activity — docTitle', () => {
  it('uses the collection title field, then common names, then the id', () => {
    expect(docTitle({ id: 1, fullName: 'ليلى' }, 'fullName')).toBe('ليلى')
    expect(docTitle({ id: 1, name: 'x' })).toBe('x')
    expect(docTitle({ id: 1, title: { ar: 'عربي', en: 'en' } }, 'title')).toBe('عربي')
    expect(docTitle({ id: 9 })).toBe('#9')
  })
})

const staff = (role = 'editor') => ({ id: 5, email: 'ed@example.test', role, collection: 'users' })

function fakeReq(user: unknown, context: Record<string, unknown> = {}) {
  const create = vi.fn(async () => ({}))
  return {
    req: { user, context, locale: 'ar', payload: { create, logger: { error: vi.fn() } } },
    create,
  }
}

const collection = logActivity({
  slug: 'programs',
  admin: { useAsTitle: 'title' },
  fields: [{ name: 'title', type: 'text' }],
  hooks: { afterChange: [async ({ doc }) => doc] },
})

async function change(
  user: unknown,
  operation: 'create' | 'update',
  doc: Record<string, unknown>,
  previousDoc: Record<string, unknown> = {},
  context = {},
) {
  const { req, create } = fakeReq(user, context)
  const hook = collection.hooks!.afterChange!.at(-1)!
  await hook({
    doc,
    previousDoc,
    operation,
    req,
    context: req.context,
    collection: { slug: 'programs', admin: { useAsTitle: 'title' }, fields: collection.fields },
    data: {},
  } as never)
  return create
}

describe('activity — collection hooks', () => {
  it('keeps the collection’s own hooks and appends its own', () => {
    expect(collection.hooks!.afterChange).toHaveLength(2)
    expect(collection.hooks!.afterDelete).toHaveLength(1)
  })
  it('records an update by a staff user with the changed fields', async () => {
    const create = await change(staff(), 'update', { id: 1, title: 'b' }, { id: 1, title: 'a' })
    expect(create).toHaveBeenCalledTimes(1)
    const [args] = create.mock.calls[0] as unknown as [Record<string, unknown>]
    expect(args.collection).toBe('activity')
    expect(args.overrideAccess).toBe(true)
    expect(args.data).toMatchObject({
      action: 'update',
      target: 'programs',
      docId: '1',
      title: 'b',
      user: 5,
      userEmail: 'ed@example.test',
      locale: 'ar',
      changes: [{ field: 'title', from: 'a', to: 'b' }],
    })
  })
  it('records a create with no changes list', async () => {
    const create = await change(staff('admin'), 'create', { id: 2, title: 'new' })
    const [args] = create.mock.calls[0] as unknown as [{ data: Record<string, unknown> }]
    expect(args.data).toMatchObject({ action: 'create', docId: '2', changes: [] })
  })
  it('records a delete', async () => {
    const { req, create } = fakeReq(staff())
    const hook = collection.hooks!.afterDelete![0]!
    await hook({
      doc: { id: 3, title: 'gone' },
      id: 3,
      req,
      context: {},
      collection: { slug: 'programs', admin: { useAsTitle: 'title' } },
    } as never)
    const [args] = create.mock.calls[0] as unknown as [{ data: Record<string, unknown> }]
    expect(args.data).toMatchObject({ action: 'delete', docId: '3', title: 'gone' })
  })
  it('skips writes with no signed-in staff user (seed, public forms)', async () => {
    expect(await change(null, 'create', { id: 1 })).not.toHaveBeenCalled()
    expect(
      await change({ id: 1, collection: 'students' }, 'create', { id: 1 }),
    ).not.toHaveBeenCalled()
  })
  it('skips the system’s own follow-up writes', async () => {
    const create = await change(
      staff(),
      'update',
      { id: 1, title: 'b' },
      { id: 1, title: 'a' },
      { [SKIP_ACTIVITY]: true },
    )
    expect(create).not.toHaveBeenCalled()
  })
  it('never lets a failed log write break the edit', async () => {
    const { req, create } = fakeReq(staff())
    create.mockRejectedValueOnce(new Error('db down'))
    const hook = collection.hooks!.afterChange!.at(-1)!
    const doc = { id: 1, title: 'x' }
    await expect(
      hook({
        doc,
        previousDoc: {},
        operation: 'create',
        req,
        context: {},
        collection: { slug: 'programs', fields: [] },
        data: {},
      } as never),
    ).resolves.toBe(doc)
    expect(req.payload.logger.error).toHaveBeenCalled()
  })
  it('does not wrap the log itself', () => {
    const cfg = { slug: 'activity', fields: [] }
    expect(logActivity(cfg)).toBe(cfg)
  })
})

describe('activity — globals', () => {
  it('records a save as an update titled with the global’s Arabic label', async () => {
    const global = logGlobalActivity({
      slug: 'site-settings',
      label: { ar: 'إعدادات الموقع', en: 'Site settings' },
      fields: [{ name: 'contactEmail', type: 'email', label: { ar: 'بريد', en: 'Email' } }],
    })
    const { req, create } = fakeReq(staff())
    await global.hooks!.afterChange![0]!({
      doc: { contactEmail: 'b@x.test' },
      previousDoc: { contactEmail: 'a@x.test' },
      req,
      context: {},
      global: { slug: 'site-settings', label: global.label, fields: global.fields },
      data: {},
    } as never)
    const [args] = create.mock.calls[0] as unknown as [{ data: Record<string, unknown> }]
    expect(args.data).toMatchObject({
      action: 'update',
      target: 'site-settings',
      title: 'إعدادات الموقع',
      changes: [{ field: 'contactEmail', from: 'a@x.test', to: 'b@x.test' }],
    })
  })
  it('lists every collection and global as a target option with both labels', () => {
    expect(
      targetOptions(
        [{ slug: 'programs', labels: { singular: { ar: 'برنامج', en: 'Program' } }, fields: [] }],
        [{ slug: 'footer', label: 'Footer', fields: [] }],
      ),
    ).toEqual([
      { value: 'programs', label: { ar: 'برنامج', en: 'Program' } },
      { value: 'footer', label: { ar: 'Footer', en: 'Footer' } },
    ])
  })
})
