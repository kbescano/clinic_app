import React from 'react'
import './globals.css'
import { getPayload } from 'payload'
import config from '@/payload.config'
import MobileMenu from './components/MobileMenu'
import { ColorConfig } from '@/payload-types'
import { Ovo } from 'next/font/google'
import Navbar from './components/Navbar'
import { ContactProvider } from './components/ContactContext'
import ScrollToTop from './components/ScrollToTop'

// 1. Import your new Notification context and modal
import { NotificationProvider } from './components/NotificationContext'
import NotificationModal from './components/NotificationModal'

const ovo = Ovo({
  weight: '400', // Ovo only comes in regular weight
  subsets: ['latin'],
  variable: '--font-ovo', // This name is used in Tailwind config
})

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

  const contactData = await payload.findGlobal({ slug: 'contact-config' })
  const headerData = await payload.findGlobal({ slug: 'header-config' })

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
      <body className={`${ovo.variable} antialiased`}>
        <ScrollToTop />

        {/* 2. Wrap the entire app architecture in the NotificationProvider */}
        <NotificationProvider>
          <ContactProvider contactData={contactData}>
            <Navbar contactData={contactData} headerData={headerData} />
            <main className="min-h-screen pb-20 lg:pb-0 dark:bg-black">{children}</main>
          </ContactProvider>

          <MobileMenu />

          {/* 3. Mount the Modal here so it floats over everything globally */}
          <NotificationModal />
        </NotificationProvider>
      </body>
    </html>
  )
}
