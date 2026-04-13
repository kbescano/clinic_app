'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { redirect } from 'next/navigation'
import dayjs from '@/lib/dayjs'
import crypto from 'crypto'
import { getEmailHtml } from '@/lib/emailTemplate'

// actions.ts
/**
 * Fetches busy slots for a specific date, locked to Asia/Manila.
 */
export async function getBusySlots(dateString: string) {
  const payload = await getPayload({ config })

  // FIX: Inject dateString into dayjs so it targets the clicked calendar date.
  // We strictly apply the Asia/Manila timezone before calculating the day's boundaries.
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
    // Sort by date to make the returned array predictable
    sort: 'appointmentDate',
  })

  // Modernized mapping: returns a clean array of "HH:mm" strings
  return busy.docs.map((doc) => {
    // We treat the stored ISO date as UTC, but format it for the user in PHT
    return new Date(doc.appointmentDate).toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // Ensures "09:00" format matches your timeSlots array
    })
  })
}

/**
 * Creates bookings with a strict check for existing slots
 */

export async function createBookingAction(prevState: any, formData: FormData) {
  const payload = await getPayload({ config })

  // --- PHASE 0: SANITIZATION & IDENTITY ---
  const rawRescheduleId = formData.get('rescheduleId') as string
  // Treat empty strings or literal "undefined"/"null" as null
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
    // --- PHASE 1: PREPARE ENTRIES ---
    validatedEntries = rawFirstNames.map((_, i) => {
      // Ensure we are working with PHT for the registry
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
      const conflict = await payload.find({
        collection: 'appointments',
        where: {
          and: [
            { appointmentDate: { equals: slot } },
            { status: { not_equals: 'cancelled' } },
            // If rescheduling, ignore the old record so it doesn't block its own slot
            ...(rescheduleId ? [{ id: { not_equals: rescheduleId } }] : []),
          ],
        },
        overrideAccess: true,
      })

      if (conflict.docs.length > 0) {
        const timeLabel = dayjs(slot).tz('Asia/Manila').format('h:mm A')
        return { error: `The ${timeLabel} slot was just reserved by another patient.` }
      }
    }

    // --- PHASE 3: RELEASE OLD SLOT (Ideal Reschedule Logic) ---
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

    // --- PHASE 4: SEQUENTIAL REGISTRY CREATION ---
    for (const item of validatedEntries) {
      await payload.create({
        collection: 'appointments',
        data: {
          firstName: item.firstName,
          surname: item.surname,
          email: item.email,
          phone: item.phone,
          service: Number(item.serviceId) as any,
          appointmentDate: item.appointmentDate,
          bookingGroupId: item.bookingGroupId,
          isGuest: item.isGuest,
          status: 'confirmed',
          // Set LED markers for the specialist dashboard
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
      depth: 1, // To get service titles
    })

    if (groupData.docs.length > 0) {
      const mainDoc = groupData.docs.find((d) => !d.isGuest) || groupData.docs[0]
      const contactConfig = await payload.findGlobal({ slug: 'contact-config' })
      const clinicLocation =
        typeof contactConfig?.address === 'string'
          ? contactConfig.address
          : 'Atelier Clinical Suite'

      const displayDate = dayjs(mainDoc.appointmentDate).tz('Asia/Manila').format('MMMM D, YYYY')
      const displayTime = dayjs(mainDoc.appointmentDate).tz('Asia/Manila').format('hh:mm A')

      const attendees = groupData.docs.map((doc) => ({
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
  } catch (err: any) {
    if (err.digest?.includes('NEXT_REDIRECT')) throw err

    // This will help you see EXACTLY what was sent to Payload
    console.error('CRITICAL REGISTRY ERROR:', err)
    console.error('DATA SENT:', validatedEntries)

    return { error: 'Server error. Please check your data.' }
  }

  // --- PHASE 6: DYNAMIC SUCCESS REDIRECT ---
  // Grab the query string we generated on the frontend
  const redirectQuery = formData.get('redirectQuery')

  // Redirect with the dynamic data if it exists, otherwise fallback to the default base path
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

  // 1. Fetch ALL appointments for this email (no date filter yet)
  // This ensures we find the user if they have ANY history.
  const result = await payload.find({
    collection: 'appointments',
    where: {
      and: [{ email: { equals: cleanEmail } }, { status: { not_equals: 'cancelled' } }],
    },
    sort: '-appointmentDate', // Latest first
    limit: 100,
  })

  // If no records at all, return null so handleLookup shows "No record found"
  if (result.docs.length === 0) return null

  // 2. Identify the Main Booker for profile info
  const mainRecord = result.docs.find((d: any) => !d.isGuest) || result.docs[0]

  // 3. Filter for UPCOMING only to send to the status page logic
  const upcomingDocs = result.docs.filter(
    (doc: any) =>
      dayjs(doc.appointmentDate).isAfter(dayjs(nowInManila)) ||
      dayjs(doc.appointmentDate).isSame(dayjs(nowInManila)),
  )

  const appointments = upcomingDocs.map((apt: any) => ({
    date: apt.appointmentDate,
    service: typeof apt.service === 'object' ? apt.service.title : apt.service,
    firstName: apt.firstName,
    surname: apt.surname,
    isGuest: apt.isGuest,
  }))

  return {
    firstName: mainRecord.firstName,
    surname: mainRecord.surname,
    phone: mainRecord.phone,
    email: mainRecord.email,
    // If this array is empty, handleLookup will redirect to /booking
    appointments: appointments,
  }
}
