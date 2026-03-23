'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { redirect } from 'next/navigation'

/**
 * Fetches all booked time slots for a specific date
 */
export async function getBusySlots(date: string) {
  const payload = await getPayload({ config })

  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const existing = await payload.find({
    collection: 'appointments',
    where: {
      and: [
        { appointmentDate: { greater_than_equal: startOfDay.toISOString() } },
        { appointmentDate: { less_than_equal: endOfDay.toISOString() } },
        { status: { not_equals: 'cancelled' } },
      ],
    },
    limit: 100,
  })

  return existing.docs.map((apt) => {
    const d = new Date(apt.appointmentDate)
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  })
}

/**
 * Creates bookings with a strict check for existing slots
 */
export async function createBookingAction(prevState: any, formData: FormData) {
  const payload = await getPayload({ config })

  const firstNames = formData.getAll('firstName') as string[]
  const surnames = formData.getAll('surname') as string[]
  const emails = formData.getAll('email') as string[]
  const phones = formData.getAll('phone') as string[]
  const serviceIds = formData.getAll('serviceId') as string[]
  const appointmentDates = formData.getAll('appointmentDate') as string[]

  try {
    // We iterate sequentially to ensure we don't double-book in the same batch
    // or against existing records in the database.
    for (let i = 0; i < firstNames.length; i++) {
      const isoDate = new Date(appointmentDates[i]).toISOString()

      // 1. ATOMIC CHECK: Does this exact slot exist already?
      const conflict = await payload.find({
        collection: 'appointments',
        where: {
          and: [{ appointmentDate: { equals: isoDate } }, { status: { not_equals: 'cancelled' } }],
        },
      })

      if (conflict.docs.length > 0) {
        // If a conflict is found, stop everything and tell the user
        const timeLabel = new Date(isoDate).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
        return { error: `The ${timeLabel} slot was just taken. Please choose another time.` }
      }

      // 2. CREATE: If no conflict, create the record
      await payload.create({
        collection: 'appointments',
        data: {
          firstName: firstNames[i],
          surname: surnames[i],
          email: emails[i],
          phone: phones[i],
          service: Number(serviceIds[i]) as any,
          appointmentDate: isoDate,
          status: 'confirmed',
        },
      })
    }
  } catch (err: any) {
    console.error('Multi-Booking Error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }

  // 3. SUCCESS REDIRECT
  redirect('/booking/confirmation')
}

/**
 * Look up existing customer by email
 */
export async function getCustomerByEmail(email: string) {
  const payload = await getPayload({ config })

  // 1. Get the current time in ISO format
  const now = new Date().toISOString()

  const result = await payload.find({
    collection: 'appointments',
    where: {
      and: [
        {
          email: {
            equals: email,
          },
        },
        {
          // 2. Ensure we only get future appointments
          appointmentDate: {
            greater_than_equal: now,
          },
        },
        {
          status: {
            not_equals: 'cancelled',
          },
        },
      ],
    },
    sort: 'appointmentDate', // 3. Sort by soonest first
    depth: 1,
    limit: 10, // Increase limit to catch multiple upcoming visits
  })

  if (result.docs.length > 0) {
    const appointments = result.docs.map((apt: any) => ({
      // Ensure we pass the raw ISO string to the frontend for PHT formatting
      date: apt.appointmentDate,
      service: typeof apt.service === 'object' ? apt.service.title : 'Specialist Treatment',
    }))

    return {
      firstName: result.docs[0].firstName,
      surname: result.docs[0].surname,
      phone: result.docs[0].phone,
      appointments,
    }
  }

  return null
}
