'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'

export async function saveSpecialistNote(appointmentId: string, note: string) {
  const payload = await getPayload({ config })

  try {
    await payload.update({
      collection: 'appointments',
      id: appointmentId,
      data: {
        specialistNotes: note,
      },
    })

    // This clears the cache so the table shows the new data
    revalidatePath('/medical-history')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false }
  }
}
