import { describe, expect, it } from 'vitest'
import { pinnedDatabaseUrl } from '@/lib/payload/db-url'

describe('pinnedDatabaseUrl', () => {
  const neon = 'postgresql://u:p@ep-x-pooler.neon.tech/neondb'

  it.each(['prefer', 'require', 'verify-ca', 'REQUIRE'])(
    'pins sslmode=%s to verify-full',
    (mode) => {
      expect(pinnedDatabaseUrl(`${neon}?sslmode=${mode}&channel_binding=require`)).toBe(
        `${neon}?sslmode=verify-full&channel_binding=require`,
      )
    },
  )

  it('pins it wherever it sits in the query', () => {
    expect(pinnedDatabaseUrl(`${neon}?channel_binding=require&sslmode=require`)).toBe(
      `${neon}?channel_binding=require&sslmode=verify-full`,
    )
  })

  it.each([
    ['a URL without sslmode', 'postgresql://jaa:jaa@127.0.0.1:5432/jaa'],
    ['sslmode=disable', `${neon}?sslmode=disable`],
    ['sslmode=verify-full', `${neon}?sslmode=verify-full`],
    ['another parameter that ends in the same word', `${neon}?channel_binding=require`],
  ])('leaves %s alone', (_, url) => {
    expect(pinnedDatabaseUrl(url)).toBe(url)
  })

  it('turns a missing URL into the empty string the adapter expects', () => {
    expect(pinnedDatabaseUrl(undefined)).toBe('')
  })
})
