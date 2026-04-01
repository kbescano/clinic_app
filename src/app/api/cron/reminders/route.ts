// src/app/api/cron/reminders/route.ts
// import { getPayload } from 'payload'
// import config from '@/payload.config'
// import dayjs from '@/lib/dayjs'
// import { getEmailHtml } from '../../../../lib/emailTemplate'

export async function GET(request: Request) {
  // 2. THE SECURITY GATE: Check for the CRON_SECRET
  //   const authHeader = request.headers.get('authorization')
  //   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //     return Response.json({ error: 'Unauthorized' }, { status: 401 })
  //   }
  //   const payload = await getPayload({ config })
  //   const now = dayjs().tz('Asia/Manila')
  //   // Fetch the location ONCE outside the loop
  //   const contactConfig = await payload.findGlobal({
  //     slug: 'contact-config',
  //   })
  //   const clinicLocation = typeof contactConfig?.address === 'string' ? contactConfig.address : ''
  //   // 1. Find 24H Reminders (Appointments between 23h and 25h from now)
  //   const remind24 = await payload.find({
  //     collection: 'appointments',
  //     where: {
  //       and: [
  //         { appointmentDate: { greater_than: now.add(23, 'hour').toISOString() } },
  //         { appointmentDate: { less_than: now.add(25, 'hour').toISOString() } },
  //         { 'emailStatus.reminder24hSent': { equals: false } },
  //         { status: { equals: 'confirmed' } },
  //         { isGuest: { equals: false } }, // Filters out guests so only 1 email sends
  //       ],
  //     },
  //   })
  //   // 2. Find 2H Reminders (Appointments between 1h and 3h from now)
  //   const remind2 = await payload.find({
  //     collection: 'appointments',
  //     where: {
  //       and: [
  //         { appointmentDate: { greater_than: now.add(1, 'hour').toISOString() } },
  //         { appointmentDate: { less_than: now.add(3, 'hour').toISOString() } },
  //         { 'emailStatus.reminder2hSent': { equals: false } },
  //         { status: { equals: 'confirmed' } },
  //         { isGuest: { equals: false } }, // Filters out guests so only 1 email sends
  //       ],
  //     },
  //   })
  //   const processEmails = async (docs: any[], type: '24h' | '2h') => {
  //     for (const doc of docs) {
  //       const date = dayjs(doc.appointmentDate).tz('Asia/Manila').format('MMMM D, YYYY')
  //       const time = dayjs(doc.appointmentDate).tz('Asia/Manila').format('hh:mm a')
  //       // Build the Unified Attendee Manifest
  //       const attendees: { name: string; service: string; isPrimary: boolean }[] = []
  //       const primaryServiceName =
  //         typeof doc.service === 'object'
  //           ? doc.service?.title || doc.service?.name || 'Scheduled Procedure'
  //           : 'Scheduled Procedure'
  //       attendees.push({
  //         name: `${doc.firstName} ${doc.surname}`,
  //         service: primaryServiceName,
  //         isPrimary: true,
  //       })
  //       // Fetch accompanying guests if this is the main booker
  //       if (!doc.isGuest && doc.bookingGroupId) {
  //         const accompanying = await payload.find({
  //           collection: 'appointments',
  //           where: {
  //             and: [
  //               { bookingGroupId: { equals: doc.bookingGroupId } },
  //               { isGuest: { equals: true } },
  //             ],
  //           },
  //         })
  //         accompanying.docs.forEach((g) => {
  //           attendees.push({
  //             name: `${g.firstName} ${g.surname}`,
  //             service: typeof g.service === 'object' ? g.service?.title || 'Procedure' : 'Procedure',
  //             isPrimary: false,
  //           })
  //         })
  //       }
  //       await payload.sendEmail({
  //         to: doc.email,
  //         from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
  //         subject:
  //           type === '24h' ? 'Reminder: Your session is tomorrow' : 'Your session starts in 2 hours',
  //         // Inject the missing arguments here:
  //         html: getEmailHtml(doc.firstName, date, time, type, clinicLocation, attendees),
  //       })
  //       // Ensure we don't overwrite the other email status flags when updating
  //       await payload.update({
  //         collection: 'appointments',
  //         id: doc.id,
  //         data: {
  //           emailStatus: {
  //             ...doc.emailStatus,
  //             [type === '24h' ? 'reminder24hSent' : 'reminder2hSent']: true,
  //           },
  //         },
  //       })
  //     }
  //   }
  //   await Promise.all([processEmails(remind24.docs, '24h'), processEmails(remind2.docs, '2h')])
  //   return Response.json({ success: true })
}
