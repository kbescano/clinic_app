'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  clearPatientSession,
  getPatientSessionEmail,
  setPatientSession,
} from '@/lib/patientSession'
import { getTenant } from '@/lib/tenants'

// --- TYPES & INTERFACES ---

interface AppointmentDoc {
  id: string | number
  firstName: string
  surname: string
  email: string
  phone: string
  appointmentDate: string
  // Change 'string' to the specific union
  status: 'confirmed' | 'completed' | 'pending' | 'cancelled'
  isGuest?: boolean
  service?: string | { title: string }
}

export interface PatientVisit {
  id: string
  date: string | Date
  // Fix the string mismatch here by using the strict union
  status: 'confirmed' | 'completed' | 'pending' | 'cancelled'
  service: string
  isGuest: boolean
  firstName: string
  surname: string
}

export interface PatientProfile {
  firstName: string
  surname: string
  email: string
  phone: string
  history: PatientVisit[]
}

/** A patient's visits at one clinic: each clinic's site only ever shows its own records. */
async function fetchPatientDocs(email: string, clinic: string): Promise<AppointmentDoc[]> {
  const tenant = await getTenant(clinic)
  if (!tenant) return []
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'appointments',
    where: { and: [{ tenant: { equals: tenant.id } }, { email: { equals: email.toLowerCase() } }] },
    sort: '-appointmentDate',
    overrideAccess: true,
    limit: 100,
  })

  return result.docs as unknown as AppointmentDoc[]
}

function buildPatientProfile(docs: AppointmentDoc[]): PatientProfile | null {
  if (docs.length === 0) return null

  const mainRecord = docs.find((d) => !d.isGuest) || docs[0]

  return {
    firstName: mainRecord.firstName,
    surname: mainRecord.surname,
    email: mainRecord.email,
    phone: mainRecord.phone,
    history: docs.map((d) => ({
      id: String(d.id),
      date: d.appointmentDate,
      service: typeof d.service === 'object' ? d.service.title : d.service || 'Clinical Treatment',
      status: d.status,
      isGuest: !!d.isGuest,
      firstName: d.firstName,
      surname: d.surname,
    })),
  }
}

export async function verifyPatientProfile(email: string, lastFour: string, clinic: string) {
  const cleanEmail = email.trim().toLowerCase()

  // endsWith('') is always true, so anything other than exactly four digits must be rejected.
  if (!/^\d{4}$/.test(lastFour)) return { error: 'Verification failed.' }

  const docs = await fetchPatientDocs(cleanEmail, clinic)

  const isVerified = docs.some((doc) => doc.phone.replace(/\D/g, '').endsWith(lastFour))

  if (!isVerified) return { error: 'Verification failed.' }

  await setPatientSession(cleanEmail)

  // RETURN DATA DIRECTLY to avoid "undefined" flicker
  return { success: true, data: buildPatientProfile(docs) }
}

export async function getStoredPatientProfile(clinic: string): Promise<PatientProfile | null> {
  const email = await getPatientSessionEmail()
  if (!email) return null
  return buildPatientProfile(await fetchPatientDocs(email, clinic))
}

export async function logoutPatient() {
  await clearPatientSession()
}
