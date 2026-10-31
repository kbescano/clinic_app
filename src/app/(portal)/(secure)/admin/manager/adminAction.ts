'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { appointmentScope, assertPortal, assertPortalStaff } from '@/lib/auth'

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
  const { tenant } = await assertPortalStaff()
  const payload = await getPayload({ config })

  const parsedSpecialistId = specialistId ? Number(specialistId) : null

  // Both ids come from the browser: the appointment and the specialist must be this clinic's.
  const [appointment, specialist] = await Promise.all([
    payload.findByID({ collection: 'appointments', id: appointmentId, depth: 0 }).catch(() => null),
    parsedSpecialistId ? payload.findByID({ collection: 'specialists', id: parsedSpecialistId, depth: 0 }).catch(() => null) : null,
  ])
  const tenantOf = (doc: { tenant?: number | { id: number } | null } | null) =>
    typeof doc?.tenant === 'object' ? doc?.tenant?.id : doc?.tenant
  if (!appointment || tenantOf(appointment) !== tenant.id) throw new Error('Appointment not found')
  if (parsedSpecialistId && (!specialist || tenantOf(specialist) !== tenant.id)) throw new Error('Specialist not found')

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
  const session = await assertPortal()
  const payload = await getPayload({ config })
  const data = await payload.find({
    collection: 'appointments',
    where: appointmentScope(session),
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
