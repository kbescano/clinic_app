import React from 'react'
import type { Metadata } from 'next'
import { CLINIC_SLUGS } from '@/lib/clinics'
import { brandOf, getTenant, requireTenant } from '@/lib/tenants'
import { ClinicProvider } from '../components/ClinicContext'
import Navbar from '../components/Navbar'
import WebsiteMenu from '../components/WebsiteMenu'
import DentalNav from '../components/dental/DentalNav'

// Only the configured clinics exist; anything else under /[clinic] is a 404.
export const dynamicParams = false
export const generateStaticParams = () => CLINIC_SLUGS.map((clinic) => ({ clinic }))

type Props = { children: React.ReactNode; params: Promise<{ clinic: string }> }

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const tenant = await getTenant((await params).clinic)
  return tenant ? { title: tenant.name, description: tenant.topLabel || `Book a visit at ${tenant.name}.` } : {}
}

/** One clinic's public site. The clinic's slug picks the design: skin (bold, black and white) or dental. */
export default async function ClinicLayout({ children, params }: Props) {
  const tenant = await requireTenant((await params).clinic)
  const brand = brandOf(tenant)

  if (tenant.slug === 'dental') {
    return (
      <ClinicProvider brand={brand}>
        <div className="min-h-screen bg-paper font-dental text-ink selection:bg-flame selection:text-ink">
          <DentalNav />
          {children}
        </div>
      </ClinicProvider>
    )
  }

  return (
    <ClinicProvider brand={brand}>
      <Navbar headerData={{ topLabel: brand.topLabel, clinicName: brand.name, logoUrl: brand.logoUrl }} />
      <main className="min-h-screen pb-20 lg:pb-0 dark:bg-black">{children}</main>
      <WebsiteMenu />
    </ClinicProvider>
  )
}
