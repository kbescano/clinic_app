import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Media, Tenant } from '@/payload-types'
import { isClinicSlug, type ClinicBrand } from './clinics'

/** A clinic by its URL slug, once per request. Null when the slug is unknown or not set up yet. */
export const getTenant = cache(async (slug: string): Promise<Tenant | null> => {
  if (!isClinicSlug(slug)) return null
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'tenants', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return docs[0] ?? null
})

/** For pages under /[clinic]: the clinic, or a 404. */
export async function requireTenant(slug: string): Promise<Tenant> {
  const tenant = await getTenant(slug)
  if (!tenant) notFound()
  return tenant
}

export const getTenants = cache(async (): Promise<Tenant[]> => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'tenants', sort: 'id', limit: 20, depth: 0 })
  return docs
})

/** What the public site needs for its header and footer, safe to pass to client components. */
export function brandOf(tenant: Tenant): ClinicBrand {
  const logo = tenant.logo as Media | number | null | undefined
  return {
    slug: tenant.slug,
    name: tenant.name,
    topLabel: tenant.topLabel ?? '',
    logoUrl: typeof logo === 'object' && logo?.url ? logo.url : null,
    contact: tenant.contact,
  }
}
