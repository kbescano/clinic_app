import { cookies, headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Tenant } from '@/payload-types'
import { isSuperAdmin, tenantIdOf } from '@/access/tenants'
import { getTenant, getTenants } from '@/lib/tenants'

/** Which clinic a super admin is looking at in the portal. Staff are always in their own clinic. */
export const PORTAL_CLINIC_COOKIE = 'portal_clinic'

/**
 * Staff session check for the portal. The portal reads through the Local API (which bypasses
 * collection access control), so every portal entry point must call one of these itself.
 */
export async function getStaffUser() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })
  return user?.collection === 'users' && user.role === 'admin' ? user : null
}

/**
 * The signed-in staff member and the clinic (tenant) the portal is showing. Every portal query
 * must filter on `tenant.id`: one clinic's staff never see another clinic's patients.
 */
export async function getPortalSession() {
  const user = await getStaffUser()
  if (!user) return null

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

  return tenant ? { user, tenant, canSwitchClinic: isSuperAdmin(user) } : null
}

/** For server components: send visitors without a staff session (or a clinic) to the portal login. */
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
