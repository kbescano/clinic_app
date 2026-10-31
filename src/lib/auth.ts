import { cookies, headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload, type Where } from 'payload'
import config from '@/payload.config'
import type { Tenant } from '@/payload-types'
import { isSuperAdmin, tenantIdOf } from '@/access/tenants'
import { getTenant, getTenants } from '@/lib/tenants'
import { getDemoClinic } from '@/lib/portalDemo'

/** Which clinic a super admin is looking at in the portal. Staff are always in their own clinic. */
export const PORTAL_CLINIC_COOKIE = 'portal_clinic'

/** Seeded sample bookings (scripts/seed-appointments.mjs) all carry this in their group id. */
const SAMPLE_BOOKING_MARK = 'SEED-'

/**
 * Staff session check for the portal. The portal reads through the Local API (which bypasses
 * collection access control), so every portal entry point must call one of these itself.
 */
export async function getStaffUser() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })
  return user?.collection === 'users' && user.role === 'admin' ? user : null
}

export interface PortalSession {
  /** Shown in the header; "Demo" for demo sessions. */
  email: string
  /** The clinic the portal is showing. Every portal query must be scoped with appointmentScope(). */
  tenant: Tenant
  canSwitchClinic: boolean
  /** A demo visitor: sample bookings only, and nothing can be changed. */
  demo: boolean
}

/**
 * The signed-in staff member (or demo visitor) and the clinic the portal is showing. One clinic's
 * staff never see another clinic's patients; demo visitors never see a real patient.
 */
export async function getPortalSession(): Promise<PortalSession | null> {
  const user = await getStaffUser()

  if (!user) {
    const demoClinic = await getDemoClinic()
    const tenant = demoClinic ? await getTenant(demoClinic) : null
    return tenant ? { email: 'Demo', tenant, canSwitchClinic: false, demo: true } : null
  }

  let tenant: Tenant | null = null
  if (isSuperAdmin(user)) {
    // A super admin picks the clinic; until they do, they start in their home clinic (or the first).
    const chosen = (await cookies()).get(PORTAL_CLINIC_COOKIE)?.value
    const tenants = await getTenants()
    tenant =
      (chosen ? await getTenant(chosen) : null) ??
      tenants.find((t) => t.id === tenantIdOf(user)) ??
      tenants[0] ??
      null
  } else {
    const id = tenantIdOf(user)
    if (id) {
      const payload = await getPayload({ config })
      tenant = await payload.findByID({ collection: 'tenants', id, depth: 0 }).catch(() => null)
    }
  }

  return tenant ? { email: user.email, tenant, canSwitchClinic: isSuperAdmin(user), demo: false } : null
}

/** The appointments a portal session may see: its clinic's, and for demo visitors only sample ones. */
export function appointmentScope(session: PortalSession): Where {
  return session.demo
    ? { and: [{ tenant: { equals: session.tenant.id } }, { bookingGroupId: { like: SAMPLE_BOOKING_MARK } }] }
    : { tenant: { equals: session.tenant.id } }
}

/** For server components: send visitors without a staff or demo session to the portal login. */
export async function requirePortal() {
  const session = await getPortalSession()
  if (!session) redirect('/login')
  return session
}

/** For server actions and route handlers: reject the call outright. */
export async function assertPortal() {
  const session = await getPortalSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

/** For anything that changes data: staff only, never a demo session. */
export async function assertPortalStaff() {
  const session = await assertPortal()
  if (session.demo) throw new Error('Demo mode is view-only.')
  return session
}

export const DEMO_READ_ONLY = 'Demo mode is view-only. Sign in as staff to make changes.'
