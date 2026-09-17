import { describe, expect, it } from 'vitest'
import { robotsFor } from '@/app/robots'

describe('robots.txt', () => {
  it('blocks everything on a preview deployment', () => {
    const r = robotsFor(true, 'https://jaa.vercel.app')
    expect(r.rules).toEqual([{ userAgent: '*', disallow: '/' }])
    expect(r.sitemap).toBeUndefined()
  })

  it('allows the site but not admin, api, forms, or the styleguide in production', () => {
    const r = robotsFor(false, 'https://jilaltufan.org')
    expect(r.sitemap).toBe('https://jilaltufan.org/sitemap.xml')
    const rule = (Array.isArray(r.rules) ? r.rules[0] : r.rules)!
    expect(rule.allow).toBe('/')
    expect(rule.disallow).toContain('/admin')
  })
})
