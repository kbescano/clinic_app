'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'

// Define a local interface to satisfy the linter
interface AppointmentResult {
  id: string | number
  firstName: string
  surname: string
  email: string
  phone: string
  service?: { title: string } | number | string
  appointmentDate: string
  endDateTime?: string
  status: 'confirmed' | 'cancelled' | 'pending' | 'completed'
  isGuest?: boolean
  specialist?: number | string | { id: string | number }
  emailStatus?: {
    confirmationSent?: boolean
    reminder24hSent?: boolean
    reminder2hSent?: boolean
  }
}

export async function assignSpecialistAction(appointmentId: string, specialistId: string | null) {
  const payload = await getPayload({ config })

  const parsedSpecialistId = specialistId ? Number(specialistId) : null

  await payload.update({
    collection: 'appointments',
    id: appointmentId,
    data: {
      specialist: parsedSpecialistId,
    },
    overrideAccess: true,
  })

  revalidatePath('/admin/manager')
}

export async function getGlobalCacheAction() {
  const payload = await getPayload({ config })
  const data = await payload.find({
    collection: 'appointments',
    limit: 1000,
    depth: 1, // Ensure service and specialist titles are populated
  })

  // We cast the docs to our interface to remove the 'any' warning
  const docs = data.docs as unknown as AppointmentResult[]

  return docs.map((a) => ({
    id: a.id,
    firstName: a.firstName,
    surname: a.surname,
    email: a.email,
    phone: a.phone,
    // Handling the potentially nested service title
    services: [
      typeof a.service === 'object' && a.service !== null
        ? a.service.title
        : 'General Consultation',
    ],
    appointmentDate: a.appointmentDate,
    endDateTime: a.endDateTime,
    status: a.status,
    isGuest: a.isGuest,
    // Safely extract the ID regardless of whether it's populated or raw
    specialist: typeof a.specialist === 'object' ? a.specialist?.id : a.specialist,
    emailStatus: a.emailStatus,
  }))
}
