'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { redirect } from 'next/navigation'
import dayjs from '@/lib/dayjs'
import crypto from 'crypto'
import { getEmailHtml } from '@/lib/emailTemplate'
import { cookies } from 'next/headers'

const PATIENT_SESSION_KEY = 'patient_registry_token'

// --- TYPES & INTERFACES ---

interface BookingConfigGlobal {
  openingTime?: string
  closingTime?: string
  slotInterval?: string
  specialistCapacity?: number
  lunchBreak?: {
    start?: string
    end?: string
  }
}

interface ServiceDoc {
  id: string | number
  title: string
  duration?: string | number
}

interface AppointmentDoc {
  id: string
  firstName: string
  surname: string
  email: string
  phone: string
  appointmentDate: string
  endDateTime?: string // Added for duration tracking
  status: 'confirmed' | 'cancelled' | 'pending' | 'completed'
  isGuest?: boolean
  bookingGroupId: string
  service?: number | { id: string | number; title: string }
  emailStatus?: {
    confirmationSent?: boolean
    reminder24hSent?: boolean
    reminder2hSent?: boolean
  }
}

interface BookingState {
  error?: string
  success?: boolean
}

interface ValidatedEntry {
  firstName: string
  surname: string
  email: string
  phone: string
  serviceId: string
  appointmentDate: string
  endDateTime: string // Required for collision checking
  bookingGroupId: string
  isGuest: boolean
}

/**
 * Checks if two time ranges overlap.
 */
const isOverlapping = (
  startA: dayjs.Dayjs,
  endA: dayjs.Dayjs,
  startB: dayjs.Dayjs,
  endB: dayjs.Dayjs,
): boolean => {
  return startA.isBefore(endB) && endA.isAfter(startB)
}

/**
 * Fetches busy slots for a specific date, locked to Asia/Manila.
 * Now factors in Specialist Capacity, Durations, and Lunch Breaks.
 */
export async function getBusySlots(dateString: string): Promise<string[]> {
  const payload = await getPayload({ config })

  // 1. Fetch Config
  const bookingConfig = (await payload.findGlobal({
    slug: 'booking-config',
  })) as unknown as BookingConfigGlobal
  const capacity = bookingConfig?.specialistCapacity ?? 1
  const interval = Number(bookingConfig?.slotInterval) || 30

  const openingStr = bookingConfig?.openingTime || '09:00'
  const closingStr = bookingConfig?.closingTime || '17:00'
  const lunchStartStr = bookingConfig?.lunchBreak?.start || '12:00'
  const lunchEndStr = bookingConfig?.lunchBreak?.end || '13:00'

  // 2. Fetch Appointments
  const targetDate = dayjs(dateString).tz('Asia/Manila')
  const startOfDay = targetDate.startOf('day').toISOString()
  const endOfDay = targetDate.endOf('day').toISOString()

  const busy = await payload.find({
    collection: 'appointments',
    where: {
      and: [
        { appointmentDate: { greater_than_equal: startOfDay } },
        { appointmentDate: { less_than_equal: endOfDay } },
        { status: { not_equals: 'cancelled' } },
      ],
    },
    limit: 100,
    sort: 'appointmentDate',
  })

  const existingApts = busy.docs as unknown as AppointmentDoc[]

  // 3. Generate Slots and Scan for Collisions
  const busySlotsOut: string[] = []

  let currentSlot = targetDate
    .set('hour', parseInt(openingStr.split(':')[0]))
    .set('minute', parseInt(openingStr.split(':')[1]))
  const closingTime = targetDate
    .set('hour', parseInt(closingStr.split(':')[0]))
    .set('minute', parseInt(closingStr.split(':')[1]))
  const lunchStart = targetDate
    .set('hour', parseInt(lunchStartStr.split(':')[0]))
    .set('minute', parseInt(lunchStartStr.split(':')[1]))
  const lunchEnd = targetDate
    .set('hour', parseInt(lunchEndStr.split(':')[0]))
    .set('minute', parseInt(lunchEndStr.split(':')[1]))

  while (currentSlot.isBefore(closingTime)) {
    const slotStart = currentSlot
    // Assuming the slot minimum footprint equals the interval for baseline checking
    const slotEnd = currentSlot.add(interval, 'minute')
    const slotString = slotStart.format('HH:mm')

    // Filter A: Lunch Break Check
    if (isOverlapping(slotStart, slotEnd, lunchStart, lunchEnd)) {
      busySlotsOut.push(slotString)
      currentSlot = currentSlot.add(interval, 'minute')
      continue
    }

    // Filter B: Capacity Check
    let overlapCount = 0
    for (const apt of existingApts) {
      const aptStart = dayjs(apt.appointmentDate)
      const aptEnd = apt.endDateTime ? dayjs(apt.endDateTime) : aptStart.add(60, 'minute') // Fallback

      if (isOverlapping(slotStart, slotEnd, aptStart, aptEnd)) {
        overlapCount++
      }
    }

    if (overlapCount >= capacity) {
      busySlotsOut.push(slotString)
    }

    currentSlot = currentSlot.add(interval, 'minute')
  }

  return busySlotsOut
}

/**
 * Creates bookings with a strict capacity and duration check
 */
export async function createBookingAction(prevState: any, formData: FormData) {
  const payload = await getPayload({ config })

  // 1. CLEAR EXISTING SESSION IMMEDIATELY
  const cookieStore = await cookies()
  cookieStore.delete(PATIENT_SESSION_KEY)

  const rawRescheduleId = formData.get('rescheduleId') as string
  const rescheduleId =
    rawRescheduleId &&
    rawRescheduleId !== 'undefined' &&
    rawRescheduleId !== 'null' &&
    rawRescheduleId.trim() !== ''
      ? rawRescheduleId
      : null

  const isReschedule = !!rescheduleId

  const rawFirstNames = formData.getAll('firstName').map((v) => String(v))
  const rawSurnames = formData.getAll('surname').map((v) => String(v))
  const rawEmails = formData.getAll('email').map((v) => String(v))
  const rawPhones = formData.getAll('phone').map((v) => String(v))
  const rawServiceIds = formData.getAll('serviceId').map((v) => String(v))
  const rawDates = formData.getAll('appointmentDate').map((v) => String(v))

  const bookingGroupId = `GRP-${dayjs().format('YYMMDD')}-${crypto.randomBytes(2).toString('hex')}`
  let validatedEntries: any[] = []

  try {
    // --- PHASE 1: PREPARE ENTRIES & CHAIN DURATIONS ---
    const servicesData = await payload.find({
      collection: 'services',
      where: { id: { in: Array.from(new Set(rawServiceIds)) } },
      overrideAccess: true,
    })
    const servicesDocs = servicesData.docs as any[]

    const personEndTimes: Record<string, string> = {}

    validatedEntries = rawFirstNames.map((_, i) => {
      const baseIsoDate = dayjs.tz(rawDates[i], 'Asia/Manila').toISOString()
      const currentEmail = rawEmails[i]?.trim().toLowerCase() || ''
      const currentFirstName = rawFirstNames[i]?.trim().toLowerCase() || ''
      const currentSurname = rawSurnames[i]?.trim().toLowerCase() || ''

      const mainEmail = rawEmails[0]?.trim().toLowerCase() || ''
      const mainFirstName = rawFirstNames[0]?.trim().toLowerCase() || ''
      const mainSurname = rawSurnames[0]?.trim().toLowerCase() || ''

      const isSamePersonAsMain =
        currentEmail === mainEmail &&
        currentFirstName === mainFirstName &&
        currentSurname === mainSurname

      const isGuest = i > 0 && !isSamePersonAsMain

      // Create a unique key for this person on this specific date
      const personKey = `${currentEmail}-${currentFirstName}-${currentSurname}-${baseIsoDate}`

      // CHAINING LOGIC: If this person already has a service, start this one when the last one ends
      const actualStartIso = personEndTimes[personKey] ? personEndTimes[personKey] : baseIsoDate

      // Duration Calculation
      const serviceId = rawServiceIds[i]
      const serviceDoc = servicesDocs.find((s) => String(s.id) === String(serviceId))
      const duration = Number(serviceDoc?.duration) || 60
      const actualEndIso = dayjs(actualStartIso).add(duration, 'minute').toISOString()

      // Update the tracker so the next service starts after this one
      personEndTimes[personKey] = actualEndIso

      return {
        firstName: rawFirstNames[i],
        surname: rawSurnames[i],
        email: currentEmail,
        phone: rawPhones[i],
        serviceId: serviceId,
        appointmentDate: actualStartIso, // Uses the chained start time
        endDateTime: actualEndIso, // Uses the chained end time
        bookingGroupId,
        isGuest,
      }
    })

    // --- PHASE 2: ATOMIC CAPACITY & OVERLAP CHECK ---
    const bookingConfig = (await payload.findGlobal({ slug: 'booking-config' })) as any
    const capacity = bookingConfig?.specialistCapacity ?? 1

    const earliestStart = validatedEntries.reduce(
      (min, e) => (e.appointmentDate < min ? e.appointmentDate : min),
      validatedEntries[0].appointmentDate,
    )
    const latestEnd = validatedEntries.reduce(
      (max, e) => (e.endDateTime > max ? e.endDateTime : max),
      validatedEntries[0].endDateTime,
    )

    const existingAptsData = await payload.find({
      collection: 'appointments',
      where: {
        and: [
          { endDateTime: { greater_than: earliestStart } },
          { appointmentDate: { less_than: latestEnd } },
          { status: { not_equals: 'cancelled' } },
        ],
      },
      overrideAccess: true,
      limit: 100,
    })

    let existingApts = existingAptsData.docs as any[]

    if (rescheduleId) {
      existingApts = existingApts.filter((apt) => String(apt.id) !== String(rescheduleId))
    }

    // Verify each new entry against total capacity
    for (const entry of validatedEntries) {
      const entryStart = dayjs(entry.appointmentDate)
      const entryEnd = dayjs(entry.endDateTime)
      let overlapCount = 0

      // 1. Check against DB appointments
      for (const apt of existingApts) {
        const aptStart = dayjs(apt.appointmentDate)
        const aptEnd = apt.endDateTime ? dayjs(apt.endDateTime) : aptStart.add(60, 'minute')

        if (isOverlapping(entryStart, entryEnd, aptStart, aptEnd)) {
          overlapCount++
        }
      }

      // 2. Check against OTHER entries in this exact same cart/group
      for (const otherEntry of validatedEntries) {
        if (otherEntry === entry) continue
        const otherStart = dayjs(otherEntry.appointmentDate)
        const otherEnd = dayjs(otherEntry.endDateTime)

        if (isOverlapping(entryStart, entryEnd, otherStart, otherEnd)) {
          overlapCount++
        }
      }

      if (overlapCount >= capacity) {
        const timeLabel = dayjs(entry.appointmentDate).tz('Asia/Manila').format('h:mm A')
        return {
          error: `The ${timeLabel} slot does not have enough capacity for your combined treatments.`,
        }
      }
    }

    // --- PHASE 3: RELEASE OLD SLOT ---
    if (rescheduleId) {
      await payload.update({
        collection: 'appointments',
        id: rescheduleId,
        data: { status: 'cancelled' },
        overrideAccess: true,
      })
    }

    // --- PHASE 4: SEQUENTIAL REGISTRY CREATION ---
    for (const item of validatedEntries) {
      await payload.create({
        collection: 'appointments',
        data: {
          firstName: item.firstName,
          surname: item.surname,
          email: item.email,
          phone: item.phone,
          service: Number(item.serviceId),
          appointmentDate: item.appointmentDate,
          endDateTime: item.endDateTime,
          bookingGroupId: item.bookingGroupId,
          isGuest: item.isGuest,
          status: 'confirmed',
          emailStatus: {
            confirmationSent: true,
            reminder24hSent: false,
            reminder2hSent: false,
          },
        },
      })
    }

    // --- PHASE 5: AUTO-LOGIN FOR MAIN PATIENT (CUSTOM COOKIE) ---
    const mainPatient = validatedEntries.find((e) => !e.isGuest) || validatedEntries[0]

    if (mainPatient && mainPatient.email) {
      // Set the custom cookie just like verifyPatientProfile does!
      cookieStore.set(PATIENT_SESSION_KEY, mainPatient.email.trim().toLowerCase(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      })
    }

    // --- PHASE 6: CONSOLIDATED NOTIFICATION ---
    const groupData = await payload.find({
      collection: 'appointments',
      where: { bookingGroupId: { equals: bookingGroupId } },
      depth: 1,
    })

    const groupDocs = groupData.docs as any[]

    if (groupDocs.length > 0) {
      const mainDoc = groupDocs.find((d) => !d.isGuest) || groupDocs[0]
      const contactConfig = (await payload.findGlobal({ slug: 'contact-config' })) as any
      const clinicLocation =
        typeof contactConfig?.address === 'string'
          ? contactConfig.address
          : 'Atelier Clinical Suite'

      const displayDate = dayjs(mainDoc.appointmentDate).tz('Asia/Manila').format('MMMM D, YYYY')
      const displayTime = dayjs(mainDoc.appointmentDate).tz('Asia/Manila').format('hh:mm A')

      // Optional: Add email sending logic back here using getEmailHtml
    }
  } catch (err: unknown) {
    if (err instanceof Error && (err as any).digest?.includes('NEXT_REDIRECT')) throw err
    console.error('CRITICAL REGISTRY ERROR:', err)
    return { error: 'Server error. Please check your data.' }
  }

  const redirectQuery = formData.get('redirectQuery')
  if (redirectQuery && typeof redirectQuery === 'string') {
    redirect(`/booking/confirmation?${redirectQuery}`)
  } else {
    redirect('/booking/confirmation')
  }
}

/**
 * Look up group history by email
 */
export async function getCustomerByEmail(email: string) {
  const payload = await getPayload({ config })
  const cleanEmail = email.trim().toLowerCase()
  const nowInManila = dayjs().tz('Asia/Manila').toISOString()

  const result = await payload.find({
    collection: 'appointments',
    where: {
      and: [{ email: { equals: cleanEmail } }, { status: { not_equals: 'cancelled' } }],
    },
    sort: '-appointmentDate',
    limit: 100,
  })

  const docs = result.docs as unknown as AppointmentDoc[]

  if (docs.length === 0) return null

  const mainRecord = docs.find((d) => !d.isGuest) || docs[0]

  const upcomingDocs = docs.filter(
    (doc) =>
      dayjs(doc.appointmentDate).isAfter(dayjs(nowInManila)) ||
      dayjs(doc.appointmentDate).isSame(dayjs(nowInManila)),
  )

  const appointments = upcomingDocs.map((apt) => ({
    date: apt.appointmentDate,
    service: typeof apt.service === 'object' ? apt.service.title : 'Scheduled Treatment',
    firstName: apt.firstName,
    surname: apt.surname,
    isGuest: apt.isGuest,
  }))

  return {
    firstName: mainRecord.firstName,
    surname: mainRecord.surname,
    phone: mainRecord.phone,
    email: mainRecord.email,
    appointments,
  }
}

export async function getClinicTimeSlots(): Promise<string[]> {
  const payload = await getPayload({ config })
  const bookingConfig = (await payload.findGlobal({
    slug: 'booking-config',
  })) as unknown as BookingConfigGlobal

  const interval = Number(bookingConfig?.slotInterval) || 30
  const openingStr = bookingConfig?.openingTime || '09:00'
  const closingStr = bookingConfig?.closingTime || '17:00'
  const lunchStartStr = bookingConfig?.lunchBreak?.start || '12:00'
  const lunchEndStr = bookingConfig?.lunchBreak?.end || '13:00'

  const slots: string[] = []
  let currentSlot = dayjs()
    .set('hour', parseInt(openingStr.split(':')[0]))
    .set('minute', parseInt(openingStr.split(':')[1]))
  const closingTime = dayjs()
    .set('hour', parseInt(closingStr.split(':')[0]))
    .set('minute', parseInt(closingStr.split(':')[1]))
  const lunchStart = dayjs()
    .set('hour', parseInt(lunchStartStr.split(':')[0]))
    .set('minute', parseInt(lunchStartStr.split(':')[1]))
  const lunchEnd = dayjs()
    .set('hour', parseInt(lunchEndStr.split(':')[0]))
    .set('minute', parseInt(lunchEndStr.split(':')[1]))

  while (currentSlot.isBefore(closingTime)) {
    const slotStart = currentSlot
    const slotEnd = currentSlot.add(interval, 'minute')
    const slotString = slotStart.format('HH:mm')

    // Only push the slot if it does not overlap with the lunch break
    const isOverlappingLunch = slotStart.isBefore(lunchEnd) && slotEnd.isAfter(lunchStart)
    if (!isOverlappingLunch) {
      slots.push(slotString)
    }

    currentSlot = currentSlot.add(interval, 'minute')
  }
  return slots
}
