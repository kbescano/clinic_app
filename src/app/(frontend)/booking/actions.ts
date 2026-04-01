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

  // ... (Keep your existing data extraction logic)
  const rawFirstNames = formData.getAll('firstName').map((v) => String(v))
  const rawSurnames = formData.getAll('surname').map((v) => String(v))
  const rawEmails = formData.getAll('email').map((v) => String(v))
  const rawPhones = formData.getAll('phone').map((v) => String(v))
  const rawServiceIds = formData.getAll('serviceId').map((v) => String(v))
  const rawDates = formData.getAll('appointmentDate').map((v) => String(v))

  const bookingGroupId = `GRP-${dayjs().format('YYMMDD')}-${crypto.randomBytes(2).toString('hex')}`

  try {
    // --- PHASE 1: PREPARE ENTRIES ---
    const validatedEntries = rawFirstNames.map((_, i) => {
      const isoDate = dayjs.tz(rawDates[i], 'Asia/Manila').toISOString()
      const currentEmail = rawEmails[i].trim().toLowerCase()
      const currentFirstName = rawFirstNames[i].trim().toLowerCase()
      const currentSurname = rawSurnames[i].trim().toLowerCase()

      const mainEmail = rawEmails[0].trim().toLowerCase()
      const mainFirstName = rawFirstNames[0].trim().toLowerCase()
      const mainSurname = rawSurnames[0].trim().toLowerCase()

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
          and: [{ appointmentDate: { equals: slot } }, { status: { not_equals: 'cancelled' } }],
        },
      })

      if (conflict.docs.length > 0) {
        const timeLabel = dayjs(slot).tz('Asia/Manila').format('h:mm A')
        return { error: `The ${timeLabel} slot was just taken.` }
      }
    }

    // --- PHASE 3: SEQUENTIAL CREATE ---
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
          // INITIALIZE LED STATUS: Set to true so dashboard is instantly green
          emailStatus: {
            confirmationSent: true,
            reminder24hSent: false,
            reminder2hSent: false,
          },
        },
      })
    }

    // --- PHASE 4: DISPATCH 1 CONSOLIDATED EMAIL ---
    // Fetch the group data we just saved
    const groupData = await payload.find({
      collection: 'appointments',
      where: { bookingGroupId: { equals: bookingGroupId } },
    })

    if (groupData.docs.length > 0) {
      // Find the primary booker to address the email to
      const mainDoc = groupData.docs.find((d) => !d.isGuest) || groupData.docs[0]

      // Fetch dynamic location
      const contactConfig = await payload.findGlobal({ slug: 'contact-config' })
      const clinicLocation =
        typeof contactConfig?.address === 'string'
          ? contactConfig.address
          : 'Clinical Suite, Manila'

      // Format time
      const displayDate = dayjs(mainDoc.appointmentDate).tz('Asia/Manila').format('MMMM D, YYYY')
      const displayTime = dayjs(mainDoc.appointmentDate).tz('Asia/Manila').format('hh:mm a')

      // Build the 1-Column UI Manifest
      const attendees = groupData.docs.map((doc) => {
        const serviceName =
          typeof doc.service === 'object'
            ? doc.service?.title || 'Scheduled Procedure'
            : 'Scheduled Procedure'

        return {
          name: `${doc.firstName} ${doc.surname}`,
          service: serviceName,
          isPrimary: !doc.isGuest,
        }
      })

      try {
        await payload.sendEmail({
          to: mainDoc.email, // Sent only to the main booker
          from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
          subject: `Booking Confirmed: ${mainDoc.firstName} ${mainDoc.surname}`,
          html: getEmailHtml(
            mainDoc.firstName,
            displayDate,
            displayTime,
            'confirmation',
            clinicLocation,
            attendees,
          ),
        })
      } catch (error: any) {
        console.error('Email failed to send, but booking was saved:', error)
      }
    }
  } catch (err: any) {
    if (err.digest?.includes('NEXT_REDIRECT')) throw err
    return { error: 'Server error. Please check your data.' }
  }

  redirect('/booking/confirmation')
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
