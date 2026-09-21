import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Staff session check for the portal. The portal reads through the Local API (which bypasses
 * collection access control), so every portal entry point must call one of these itself.
 */
export async function getStaffUser() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })
  return user?.collection === 'users' && user.role === 'admin' ? user : null
}

/** For server components: send unauthenticated visitors to the portal login. */
export async function requireStaff() {
  const user = await getStaffUser()
  if (!user) redirect('/login')
  return user
}

/** For server actions: reject the call outright. */
export async function assertStaff() {
  const user = await getStaffUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
