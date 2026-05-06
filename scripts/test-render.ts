import puppeteer from 'puppeteer'
import { writeFileSync } from 'fs'

const SECRET = process.env.CRON_SECRET || ''

const URLS = [
  'http://localhost:3000/render/hook',
  'http://localhost:3000/render/tesis',
  'http://localhost:3000/render/senal',
  'http://localhost:3000/render/resumen',
  'http://localhost:3000/render/proof',
  'http://localhost:3000/render/cierre'
]

async function main() {
  const browser = await puppeteer.launch({
    defaultViewport: { width: 1080, height: 1350, deviceScaleFactor: 1 },
    headless: true
  })
  for (const url of URLS) {
    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 })
    await page.setExtraHTTPHeaders({ 'x-render-secret': SECRET })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
    await page.evaluate(() => document.fonts.ready)
    await new Promise((r) => setTimeout(r, 500))
    const png = await page.screenshot({
      type: 'png',
      omitBackground: false,
      clip: { x: 0, y: 0, width: 1080, height: 1350 }
    })
    const name = url.split('/').pop()
    const path = `/tmp/${name}.png`
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
