import puppeteerCore, { type Browser } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

let browserSingleton: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (browserSingleton) return browserSingleton

  const isProd = !!(process.env.VERCEL || process.env.AWS_REGION)

  if (isProd) {
    browserSingleton = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: { width: 1080, height: 1350, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: true
    })
  } else {
    const puppeteer = await import('puppeteer')
    browserSingleton = (await puppeteer.default.launch({
      defaultViewport: { width: 1080, height: 1350, deviceScaleFactor: 1 },
      headless: true
    })) as unknown as Browser
  }

  return browserSingleton
}

export async function renderSlideToPng(url: string): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 })

    // Bypass middleware on /render/* routes.
    await page.setExtraHTTPHeaders({
      'x-render-secret': process.env.CRON_SECRET || ''
    })

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
    await page.evaluate(() => document.fonts.ready)
    // Safety wait — gives gradients/fonts a moment to settle on slow cold starts.
    await new Promise((r) => setTimeout(r, 500))

    const png = await page.screenshot({
      type: 'png',
      omitBackground: false,
      clip: { x: 0, y: 0, width: 1080, height: 1350 }
    })

    return Buffer.from(png)
  } finally {
    await page.close()
  }
}

export async function closeBrowser() {
  if (browserSingleton) {
    await browserSingleton.close()
    browserSingleton = null
  }
}
