import crypto from 'crypto'
import { cookies } from 'next/headers'
import { isClinicSlug, type ClinicSlug } from './clinics'

/**
 * The staff portal's demo mode: anyone can look around one clinic's portal without an account.
 * The cookie holds only the clinic, signed so it can't be edited into anything else. Demo sessions
 * see sample bookings only and cannot change anything (see getPortalSession and appointmentScope).
 */
export const PORTAL_DEMO_COOKIE = 'portal_demo'
const MAX_AGE_SECONDS = 60 * 60 * 8

function sign(value: string): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is required to sign demo sessions')
  return crypto.createHmac('sha256', secret).update(`portal-demo:${value}`).digest('base64url')
}

export async function startDemoSession(clinic: ClinicSlug) {
  const cookieStore = await cookies()
  cookieStore.set(PORTAL_DEMO_COOKIE, `${clinic}.${sign(clinic)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  })
}

/** The clinic of a valid demo session, or null. */
export async function getDemoClinic(): Promise<ClinicSlug | null> {
  const raw = (await cookies()).get(PORTAL_DEMO_COOKIE)?.value
  if (!raw) return null
  const [clinic, signature] = raw.split('.')
  if (!isClinicSlug(clinic) || !signature) return null
  const expected = Buffer.from(sign(clinic))
  const actual = Buffer.from(signature)
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual) ? clinic : null
}

export async function endDemoSession() {
  ;(await cookies()).delete(PORTAL_DEMO_COOKIE)
}
