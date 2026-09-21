// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

const jar = new Map<string, string>()

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}))

import {
  PATIENT_SESSION_KEY,
  clearPatientSession,
  getPatientSessionEmail,
  setPatientSession,
} from '@/lib/patientSession'

describe('patient session cookie', () => {
  beforeEach(() => {
    jar.clear()
    process.env.PAYLOAD_SECRET = 'test-secret'
  })

  it('round-trips a normalised email', async () => {
    await setPatientSession('  Jane@Example.COM ')
    expect(await getPatientSessionEmail()).toBe('jane@example.com')
  })

  it('rejects a raw email cookie (the old, forgeable format)', async () => {
    jar.set(PATIENT_SESSION_KEY, 'victim@example.com')
    expect(await getPatientSessionEmail()).toBeNull()
  })

  it('rejects a cookie whose payload was swapped for another patient', async () => {
    await setPatientSession('jane@example.com')
    const [, signature] = jar.get(PATIENT_SESSION_KEY)!.split('.')
    const forgedPayload = Buffer.from('victim@example.com').toString('base64url')
    jar.set(PATIENT_SESSION_KEY, `${forgedPayload}.${signature}`)
    expect(await getPatientSessionEmail()).toBeNull()
  })

  it('rejects a cookie signed with a different secret', async () => {
    await setPatientSession('jane@example.com')
    const signedWithOldSecret = jar.get(PATIENT_SESSION_KEY)!
    process.env.PAYLOAD_SECRET = 'rotated-secret'
    jar.set(PATIENT_SESSION_KEY, signedWithOldSecret)
    expect(await getPatientSessionEmail()).toBeNull()
  })

  it('clears the session', async () => {
    await setPatientSession('jane@example.com')
    await clearPatientSession()
    expect(await getPatientSessionEmail()).toBeNull()
  })
})
