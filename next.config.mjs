/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' }
    ]
  },
  // Keep Puppeteer + Chromium binary out of the webpack bundle. Webpack would
  // otherwise relocate them and break the runtime path lookup
  // (@sparticuz/chromium fails with "input directory /bin does not exist").
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core']
  }
}

export default nextConfig
