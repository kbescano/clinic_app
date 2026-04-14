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
