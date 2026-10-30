import React from 'react'
import RootShell from '@/components/shared/RootShell'
import { SmoothScroll } from '@/components/shared/SmoothScroll'
import { MotionProvider } from '@/components/shared/motion'
import { dental, display } from './fonts'

export const metadata = {
  description: 'Book a visit at one of our clinics.',
  title: 'Our clinics',
}

/** Root of the public sites: the clinic chooser at / and each clinic's site under /[clinic]. */
export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootShell className={`${display.variable} ${dental.variable} font-display`}>
      <SmoothScroll>
        <MotionProvider>{children}</MotionProvider>
      </SmoothScroll>
    </RootShell>
  )
}
