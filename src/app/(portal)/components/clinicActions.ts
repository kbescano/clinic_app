'use server'

import { cookies } from 'next/headers'
import { assertPortal, PORTAL_CLINIC_COOKIE } from '@/lib/auth'
import { isClinicSlug } from '@/lib/clinics'
import { getTenant } from '@/lib/tenants'

/** Super admins only: show another clinic in the portal. */
export async function switchPortalClinic(slug: string) {
  const session = await assertPortal()
  if (!session.canSwitchClinic) throw new Error('Unauthorized')
  if (!isClinicSlug(slug) || !(await getTenant(slug))) throw new Error('Unknown clinic')

  ;(await cookies()).set(PORTAL_CLINIC_COOKIE, slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  // Portal pages render per request, so the caller's router.refresh() is enough.
}
