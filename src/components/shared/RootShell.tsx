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
        {/*
          On *.netlify.app, Netlify's edge inserts "\n<!-- This site is hosted on Netlify… -->\n" into
          <head>. React can't hydrate around stray text there (error #418) and re-renders the whole page
          in the browser. This runs while the page is parsed, before hydration, and removes comments and
          whitespace-only text from <head>; React never renders either there.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=document.head;if(!h)return;for(var n=h.firstChild;n;){var x=n.nextSibling;if(n.nodeType===8||(n.nodeType===3&&!n.data.trim()))h.removeChild(n);n=x}})()`,
          }}
        />
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
