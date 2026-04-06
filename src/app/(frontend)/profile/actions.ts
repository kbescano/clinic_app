'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { cookies } from 'next/headers'

const PATIENT_SESSION_KEY = 'patient_registry_token'

// Helper to map the data so we don't repeat logic
async function mapPatientData(email: string) {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'appointments',
    where: { email: { equals: email.toLowerCase() } },
    sort: '-appointmentDate',
    overrideAccess: true,
    limit: 100,
  })

  if (result.docs.length === 0) return null

  const mainRecord = result.docs.find((d: any) => !d.isGuest) || result.docs[0]

  return {
    firstName: mainRecord.firstName,
    surname: mainRecord.surname,
    email: mainRecord.email,
    phone: mainRecord.phone,
    history: result.docs.map((d: any) => ({
      id: String(d.id),
      date: d.appointmentDate,
      service: typeof d.service === 'object' ? d.service.title : d.service,
      status: d.status,
      isGuest: d.isGuest,
      firstName: d.firstName, // Added for guest names
      surname: d.surname, // Added for guest names
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

  const isVerified = result.docs.some((doc: any) => {
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

export async function getStoredPatientProfile() {
  const cookieStore = await cookies()
  const email = cookieStore.get(PATIENT_SESSION_KEY)?.value
  if (!email) return null
  return await mapPatientData(email)
}

export async function logoutPatient() {
  const cookieStore = await cookies()
  cookieStore.delete(PATIENT_SESSION_KEY)
}
