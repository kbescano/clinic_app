import React from 'react'
import RootShell from '@/components/shared/RootShell'

export const metadata = {
  description: 'Clinic staff portal.',
  title: 'Clinic Portal',
  robots: { index: false, follow: false },
}

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <RootShell>{children}</RootShell>
}
