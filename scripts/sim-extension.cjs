// Simulates a DOM-stamping browser extension (Bitdefender TrafficLight adds
// bis_skin_checked="1" to every div before React hydrates) and reports React
// hydration errors per route. Usage: PORT=3001 node scripts/sim-extension.cjs [/route ...]
const { chromium } = require('@playwright/test')
const port = process.env.PORT ?? '3000'
const routes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      '/ar',
      '/en',
      '/ar/programs',
      '/ar/programs/palestine-our-compass',
      '/ar/about',
      '/ar/styleguide',
    ]
;(async () => {
  const b = await chromium.launch()
  let total = 0
  for (const url of routes) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
    await ctx.addInitScript(() => {
      const stamp = (n) => {
        if (n && n.nodeType === 1 && n.tagName === 'DIV' && !n.hasAttribute('bis_skin_checked'))
          n.setAttribute('bis_skin_checked', '1')
      }
      const sweep = (root) => {
        if (root && root.querySelectorAll) root.querySelectorAll('div').forEach(stamp)
      }
      new MutationObserver((ms) => {
        for (const m of ms)
          for (const n of m.addedNodes) {
            stamp(n)
            sweep(n)
          }
      }).observe(document, { childList: true, subtree: true })
      document.addEventListener('DOMContentLoaded', () => sweep(document))
    })
    const p = await ctx.newPage()
    const errs = []
    p.on('console', (m) => {
      if (m.type() === 'error') errs.push(m.text().split('\n')[0].slice(0, 110))
    })
    await p.goto(`http://localhost:${port}${url}`, { waitUntil: 'networkidle' })
    await p.waitForTimeout(1500)
    const stamped = await p.evaluate(
      () => document.querySelectorAll('div[bis_skin_checked]').length,
    )
    const hyd = errs.filter((e) => /hydrat/i.test(e))
    total += hyd.length
    console.log(
      `${url} | stamped divs: ${stamped} | hydration errors: ${hyd.length}${hyd.length ? '\n   ' + hyd.join('\n   ') : ''}`,
    )
    await ctx.close()
  }
  await b.close()
  process.exit(total ? 1 : 0)
})()
