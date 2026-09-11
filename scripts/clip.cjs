// Review helper: clipped screenshots of a route. Usage:
//   node scripts/clip.cjs /ar/styleguide 1440 out-prefix 0,1500 1500,1500 ...
const { chromium } = require('@playwright/test')
const [route, width, prefix, ...bands] = process.argv.slice(2)
const port = process.env.PORT ?? '3000'
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: +width, height: 900 } })
  await p.goto(`http://localhost:${port}${route}`, { waitUntil: 'networkidle' })
  await p.addStyleTag({
    content:
      'html{scroll-behavior:auto!important} header{position:static!important} nextjs-portal{display:none!important}',
  })
  await p.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight)
    await new Promise((r) => setTimeout(r, 200))
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 150))
    await document.fonts.ready
  })
  const total = await p.evaluate(() => document.documentElement.scrollHeight)
  for (const band of bands) {
    const [y, h] = band.split(',').map(Number)
    const height = Math.min(h, total - y)
    if (height <= 0) continue
    await p.screenshot({
      path: `${prefix}.${y}.png`,
      fullPage: true,
      clip: { x: 0, y, width: +width, height },
    })
  }
  console.log(`${route} total height ${total}`)
  await b.close()
})()
