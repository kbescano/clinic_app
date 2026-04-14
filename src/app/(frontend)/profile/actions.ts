'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { cookies } from 'next/headers'

const PATIENT_SESSION_KEY = 'patient_registry_token'

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

// Helper to map the data so we don't repeat logic
async function mapPatientData(email: string): Promise<PatientProfile | null> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'appointments',
    where: { email: { equals: email.toLowerCase() } },
    sort: '-appointmentDate',
    overrideAccess: true,
    limit: 100,
  })

  const docs = result.docs as unknown as AppointmentDoc[]

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

export async function verifyPatientProfile(email: string, lastFour: string) {
  const payload = await getPayload({ config })
  const cleanEmail = email.trim().toLowerCase()

  const result = await payload.find({
    collection: 'appointments',
    where: { email: { equals: cleanEmail } },
    overrideAccess: true,
  })

  const docs = result.docs as unknown as AppointmentDoc[]

  const isVerified = docs.some((doc) => {
    const cleanPhone = doc.phone.replace(/\D/g, '')
    return cleanPhone.endsWith(lastFour)
  })

  if (!isVerified) return { error: 'Verification failed.' }

  const cookieStore = await cookies()
  cookieStore.set(PATIENT_SESSION_KEY, cleanEmail, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  // RETURN DATA DIRECTLY to avoid "undefined" flicker
  const data = await mapPatientData(cleanEmail)
  return { success: true, data }
}

export async function getStoredPatientProfile(): Promise<PatientProfile | null> {
  const cookieStore = await cookies()
  const email = cookieStore.get(PATIENT_SESSION_KEY)?.value
  if (!email) return null
  return await mapPatientData(email)
}

export async function logoutPatient() {
  const cookieStore = await cookies()
  cookieStore.delete(PATIENT_SESSION_KEY)
}
