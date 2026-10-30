/** The clinics (tenants) this app serves. Each slug is a URL prefix and a homepage design. */
export const CLINIC_SLUGS = ['skin', 'dental'] as const
export type ClinicSlug = (typeof CLINIC_SLUGS)[number]

export const isClinicSlug = (value: unknown): value is ClinicSlug =>
  typeof value === 'string' && (CLINIC_SLUGS as readonly string[]).includes(value)

/** A path inside one clinic's website, e.g. clinicPath('dental', '/booking') → '/dental/booking'. */
export const clinicPath = (clinic: ClinicSlug, path = '') => `/${clinic}${path === '/' ? '' : path}`

/** What a clinic's public pages need for their header, footer and contact details. */
export interface ClinicBrand {
  slug: ClinicSlug
  name: string
  topLabel: string
  logoUrl: string | null
  contact: { address: string; phoneNumber: string; email: string; officeHours: string }
}
