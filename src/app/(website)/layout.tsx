import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import RootShell from '@/components/shared/RootShell'
import Navbar from './components/Navbar'
import WebsiteMenu from './components/WebsiteMenu'
import { display } from './fonts'

export const metadata = {
  description: 'A modern clinic management system.',
  title: 'Clinic App',
}

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayload({ config })
  const headerData = await payload.findGlobal({ slug: 'header-config' })

  return (
    <RootShell className={`${display.variable} font-display`}>
      <Navbar headerData={headerData} />
      <main className="min-h-screen pb-20 lg:pb-0 dark:bg-black">{children}</main>
      <WebsiteMenu />
    </RootShell>
  )
}
