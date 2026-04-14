'use server'

import { getPayload, Where } from 'payload'
import config from '@/payload.config'
import { redirect } from 'next/navigation'
import dayjs from '@/lib/dayjs'
import crypto from 'crypto'
import { getEmailHtml } from '@/lib/emailTemplate'

// --- TYPES & INTERFACES ---

interface AppointmentDoc {
  id: string
  firstName: string
  surname: string
  email: string
  phone: string
  appointmentDate: string
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
  bookingGroupId: string
  isGuest: boolean
}

/**
 * Fetches busy slots for a specific date, locked to Asia/Manila.
 */
export async function getBusySlots(dateString: string) {
  const payload = await getPayload({ config })

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

  const docs = busy.docs as unknown as AppointmentDoc[]

  return docs.map((doc) => {
    return new Date(doc.appointmentDate).toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  })
}

/**
 * Creates bookings with a strict check for existing slots
 */
export async function createBookingAction(
  prevState: BookingState | null,
  formData: FormData,
): Promise<BookingState> {
  const payload = await getPayload({ config })

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
  let validatedEntries: ValidatedEntry[] = []

  try {
    // --- PHASE 1: PREPARE ENTRIES ---
    validatedEntries = rawFirstNames.map((_, i) => {
      const isoDate = dayjs.tz(rawDates[i], 'Asia/Manila').toISOString()
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

      return {
        firstName: rawFirstNames[i],
        surname: rawSurnames[i],
        email: currentEmail,
        phone: rawPhones[i],
        serviceId: rawServiceIds[i],
        appointmentDate: isoDate,
        bookingGroupId,
        isGuest,
      }
    })

    // --- PHASE 2: ATOMIC CONFLICT CHECK ---
    const uniqueSlots = Array.from(new Set(validatedEntries.map((e) => e.appointmentDate)))
    for (const slot of uniqueSlots) {
      const conflictWhere: Where[] = [
        { appointmentDate: { equals: slot } },
        { status: { not_equals: 'cancelled' } },
      ]

      if (rescheduleId) {
        conflictWhere.push({ id: { not_equals: rescheduleId } })
      }

      const conflict = await payload.find({
        collection: 'appointments',
        where: { and: conflictWhere },
        overrideAccess: true,
      })

      if (conflict.docs.length > 0) {
        const timeLabel = dayjs(slot).tz('Asia/Manila').format('h:mm A')
        return { error: `The ${timeLabel} slot was just reserved by another patient.` }
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

    // --- PHASE 5: CONSOLIDATED NOTIFICATION ---
    const groupData = await payload.find({
      collection: 'appointments',
      where: { bookingGroupId: { equals: bookingGroupId } },
      depth: 1,
    })

    const groupDocs = groupData.docs as unknown as AppointmentDoc[]

    if (groupDocs.length > 0) {
      const mainDoc = groupDocs.find((d) => !d.isGuest) || groupDocs[0]
      const contactConfig = await payload.findGlobal({ slug: 'contact-config' })
      const clinicLocation =
        typeof contactConfig?.address === 'string'
          ? contactConfig.address
          : 'Atelier Clinical Suite'

      const displayDate = dayjs(mainDoc.appointmentDate).tz('Asia/Manila').format('MMMM D, YYYY')
      const displayTime = dayjs(mainDoc.appointmentDate).tz('Asia/Manila').format('hh:mm A')

      const attendees = groupDocs.map((doc) => ({
        name: `${doc.firstName} ${doc.surname}`,
        service: typeof doc.service === 'object' ? doc.service?.title : 'Scheduled Treatment',
        isPrimary: !doc.isGuest,
      }))

      try {
        await payload.sendEmail({
          to: mainDoc.email,
          from: process.env.FROM_EMAIL || 'registry@atelier.clinic',
          subject: isReschedule
            ? `Reschedule Confirmed: ${mainDoc.firstName} ${mainDoc.surname}`
            : `Booking Confirmed: ${mainDoc.firstName} ${mainDoc.surname}`,
          html: getEmailHtml(
            mainDoc.firstName,
            displayDate,
            displayTime,
            'confirmation',
            clinicLocation,
            attendees,
          ),
        })
      } catch (emailErr) {
        console.error('Email failed but booking saved:', emailErr)
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && (err as { digest?: string }).digest?.includes('NEXT_REDIRECT'))
      throw err
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
