import crypto from 'crypto'
import { cookies } from 'next/headers'

export const PATIENT_SESSION_KEY = 'patient_registry_token'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function sign(payload: string): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is required to sign patient sessions')
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url')
}

/** Cookie value is `<base64url(email)>.<hmac>`, so it cannot be forged by editing the cookie. */
export async function setPatientSession(email: string) {
  const cleanEmail = email.trim().toLowerCase()
  const payload = Buffer.from(cleanEmail).toString('base64url')
  const cookieStore = await cookies()
  cookieStore.set(PATIENT_SESSION_KEY, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  })
}

/** The verified email of the current patient session, or null if absent/tampered. */
export async function getPatientSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(PATIENT_SESSION_KEY)?.value
  if (!raw) return null

  const [payload, signature] = raw.split('.')
  if (!payload || !signature) return null

  const expected = Buffer.from(sign(payload))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null

  return Buffer.from(payload, 'base64url').toString('utf8') || null
}

export async function clearPatientSession() {
  const cookieStore = await cookies()
  cookieStore.delete(PATIENT_SESSION_KEY)
}
