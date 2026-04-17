'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'

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

// Add this to your existing adminAction.ts file
export async function getGlobalCacheAction() {
  const payload = await getPayload({ config })
  const data = await payload.find({
    collection: 'appointments',
    limit: 1000, // Adjust if your clinic exceeds 1000 total records
  })

  // Map to plain objects so the Client Component accepts it
  return data.docs.map((a: any) => ({
    id: a.id,
    firstName: a.firstName,
    surname: a.surname,
    email: a.email,
    phone: a.phone,
    services: [a.service?.title || 'General Consultation'],
    appointmentDate: a.appointmentDate,
    endDateTime: a.endDateTime,
    status: a.status,
    isGuest: a.isGuest,
    specialist: typeof a.specialist === 'object' ? a.specialist?.id : a.specialist,
    emailStatus: a.emailStatus,
  }))
}
