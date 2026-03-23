import React from 'react'
import './globals.css'
import { getPayload } from 'payload'
import config from '@/payload.config'
import MobileMenu from './components/MobileMenu'
import { ColorConfig } from '@/payload-types'

export const metadata = {
  description: 'A modern clinic management system.',
  title: 'Clinic App',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayload({ config })

  // Fetch branding colors from the CMS
  const branding = (await payload.findGlobal({
    slug: 'color-config',
  })) as ColorConfig

  // Fallback colors in case the CMS is empty
  const primary = branding?.primaryColor
  const secondary = branding?.secondaryColor

  return (
    <html lang="en">
      <head>
        {/* Explicitly using dangerouslySetInnerHTML ensures the CSS is injected as raw text */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          :root {
            --primary: ${primary} !important;
            --secondary: ${secondary} !important;
          }
        `,
          }}
        />
      </head>
      <body className="antialiased">
        <main className="min-h-screen pb-20 lg:pb-0 dark:bg-black">{children}</main>
        <MobileMenu />
      </body>
    </html>
  )
}
