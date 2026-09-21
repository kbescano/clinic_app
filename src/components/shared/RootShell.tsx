import React from 'react'
import '@/app/globals.css'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { ColorConfig } from '@/payload-types'
import ScrollToTop from './ScrollToTop'

/** The <html>/<body> shell both the website and the portal root layouts render. */
export default async function RootShell({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const payload = await getPayload({ config })

  // Fetch branding colors from the CMS
  const branding = (await payload.findGlobal({
    slug: 'color-config',
  })) as ColorConfig

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
      <body className={`antialiased ${className}`}>
        <ScrollToTop />
        {children}
      </body>
    </html>
  )
}
