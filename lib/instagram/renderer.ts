import puppeteerCore, { type Browser } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

// Store the launch *promise* (not the resolved Browser) so concurrent callers
// from Promise.all all await the same launch instead of racing 5 Chromium
// instances. browserPromise is reset to null on launch failure so a future
// invocation can retry rather than getting stuck on a poisoned promise.
let browserPromise: Promise<Browser> | null = null

async function launchBrowser(): Promise<Browser> {
  const isProd = !!(process.env.VERCEL || process.env.AWS_REGION)
  if (isProd) {
    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: { width: 1080, height: 1350, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: true
    })
  }
  const puppeteer = await import('puppeteer')
  return (await puppeteer.default.launch({
    defaultViewport: { width: 1080, height: 1350, deviceScaleFactor: 1 },
    headless: true
  })) as unknown as Browser
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launchBrowser().catch((err) => {
      browserPromise = null
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[render-error] step=browser-launch error=${message}`)
      throw err
    })
  }
  return browserPromise
}

export async function renderSlideToPng(url: string): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 })

    await page.setExtraHTTPHeaders({
      'x-render-secret': process.env.CRON_SECRET || ''
    })

    // 'domcontentloaded' resolves once CSS link tags (render-blocking) have
    // resolved but before all subresources idle. We then explicitly wait for
    // fonts.ready + a 500ms buffer for gradient/text-clip to settle. This
    // shaves several seconds per slide vs 'networkidle0', which matters under
    // the Vercel Hobby 60s function cap.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.evaluate(() => document.fonts.ready)
    await new Promise((r) => setTimeout(r, 500))

    const png = await page.screenshot({
      type: 'png',
      omitBackground: false,
      clip: { x: 0, y: 0, width: 1080, height: 1350 }
    })

    return Buffer.from(png)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[render-error] step=page-render url=${url} error=${message}`)
    throw err
  } finally {
    await page.close().catch(() => {})
  }
}

export async function closeBrowser() {
  if (!browserPromise) return
  const promise = browserPromise
  browserPromise = null
  try {
    const browser = await promise
    await browser.close()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[render-error] step=browser-close error=${message}`)
  }
}
