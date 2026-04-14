'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'

// --- TYPES & INTERFACES ---

interface BookingFormData {
  date: string
  time: string
  firstName: string
  surname: string
  email: string
  phone: string
  service: string | number
  isGuest?: boolean
}

/**
 * Updates an existing appointment to a new date and time.
 */
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
  } catch {
    return { error: 'Update failed.' }
  }
}

/**
 * Checks if a specific date and time slot is already occupied.
 * Returns true if taken, false if available.
 */
export async function checkAvailability(date: string, time: string) {
  const payload = await getPayload({ config })

  // Combine date and time into the clinical ISO format used in your Registry
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
            not_equals: 'cancelled',
          },
        },
      ],
    },
    overrideAccess: true,
  })

  return existing.docs.length > 0
}

/**
 * Creates bookings with a strict check for existing slots.
 */
export async function createNewBooking(formData: BookingFormData, rescheduleId?: string) {
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
          status: 'cancelled',
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
        service: formData.service as number,
        status: 'confirmed',
        isGuest: formData.isGuest || false,
      },
      overrideAccess: true,
    })

    return { success: true, id: newAppointment.id }
  } catch {
    return { error: 'Registry update failed. Please try again.' }
  }
}
