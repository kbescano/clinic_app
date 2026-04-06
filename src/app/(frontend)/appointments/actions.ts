'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { cookies } from 'next/headers'
import dayjs from '@/lib/dayjs'
import { revalidatePath } from 'next/cache'

const PATIENT_SESSION_KEY = 'patient_registry_token'

export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string,
) {
  const payload = await getPayload({ config })
  const combinedDateTime = `${newDate}T${newTime}:00`

  // 1. Double Booking Check
  const busy = await payload.find({
    collection: 'appointments',
    where: {
      and: [
        { appointmentDate: { equals: combinedDateTime } },
        { status: { not_equals: 'cancelled' } },
      ],
    },
    overrideAccess: true,
  })

  if (busy.docs.length > 0) {
    return { error: 'This slot is no longer available.' }
  }

  // 2. Perform Update
  try {
    await payload.update({
      collection: 'appointments',
      id: appointmentId,
      data: { appointmentDate: combinedDateTime },
      overrideAccess: true,
    })
    revalidatePath('/appointments')
    return { success: true }
  } catch (err) {
    return { error: 'Update failed.' }
  }
}

;('use server')

/**
 * Checks if a specific date and time slot is already occupied.
 * Returns true if taken, false if available.
 */
export async function checkAvailability(date: string, time: string) {
  const payload = await getPayload({ config })

  // Combine date and time into the clinical ISO format used in your Registry
  // Example: 2026-04-06T14:30:00
  const requestedSlot = `${date}T${time}:00`

  const existing = await payload.find({
    collection: 'appointments',
    where: {
      and: [
        {
          appointmentDate: {
            equals: requestedSlot,
          },
        },
        {
          status: {
            not_equals: 'cancelled', // Critical: allows re-booking of cancelled slots
          },
        },
      ],
    },
    overrideAccess: true,
  })

  return existing.docs.length > 0
}

// Inside your createBooking action logic
export async function createNewBooking(formData: any, rescheduleId?: string) {
  const payload = await getPayload({ config })

  // 1. Prevent Double Booking
  const isSlotTaken = await checkAvailability(formData.date, formData.time)
  if (isSlotTaken) {
    return { error: 'This clinical slot has already been reserved.' }
  }

  try {
    // 2. If Rescheduling: Tag old booking as CANCELLED
    if (rescheduleId) {
      await payload.update({
        collection: 'appointments',
        id: rescheduleId,
        data: {
          status: 'cancelled', // Frees up the old slot immediately
        },
        overrideAccess: true,
      })
    }

    // 3. Create New Registry Entry
    const newAppointment = await payload.create({
      collection: 'appointments',
      data: {
        firstName: formData.firstName,
        surname: formData.surname,
        email: formData.email,
        phone: formData.phone,
        appointmentDate: `${formData.date}T${formData.time}:00`,
        service: formData.service,
        status: 'confirmed', // Green color in your UI
        isGuest: formData.isGuest || false,
      },
      overrideAccess: true,
    })

    return { success: true, id: newAppointment.id }
  } catch (err) {
    return { error: 'Registry update failed. Please try again.' }
  }
}
