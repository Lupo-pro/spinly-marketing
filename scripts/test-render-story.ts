import puppeteer from 'puppeteer'
import { writeFileSync } from 'fs'

const SECRET = process.env.CRON_SECRET || ''

const URLS = [
  'http://localhost:3000/render/story-stat',
  'http://localhost:3000/render/story-question',
  'http://localhost:3000/render/story-teaser'
]

async function main() {
  const browser = await puppeteer.launch({
    defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 1 },
    headless: true
  })
  for (const url of URLS) {
    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 })
    await page.setExtraHTTPHeaders({ 'x-render-secret': SECRET })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
    await page.evaluate(() => document.fonts.ready)
    await new Promise((r) => setTimeout(r, 500))
    const png = await page.screenshot({
      type: 'png',
      omitBackground: false,
      clip: { x: 0, y: 0, width: 1080, height: 1920 }
    })
    const slug = url.split('/render/')[1]
    const path = `/tmp/${slug}.png`
    writeFileSync(path, Buffer.from(png as unknown as Buffer))
    console.log(`Wrote ${path}`)
    await page.close()
  }
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
