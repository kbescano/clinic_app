import type { CollectionAfterChangeHook } from 'payload'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { getEmailHtml } from '../lib/emailTemplate'

dayjs.extend(utc)
dayjs.extend(timezone)

export const sendConfirmationEmail: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req, // Extract the full 'req' object to prevent transaction deadlocks
}) => {
  const isNewlyConfirmed =
    operation === 'update' && doc.status === 'confirmed' && previousDoc?.status !== 'confirmed'

  if (isNewlyConfirmed) {
    try {
      const displayDate = dayjs(doc.appointmentDate).tz('Asia/Manila').format('MMMM D, YYYY')
      const displayTime = dayjs(doc.appointmentDate).tz('Asia/Manila').format('hh:mm a')

      // The appointment's own clinic supplies the name, address and link in the email.
      const tenantId = typeof doc.tenant === 'object' ? doc.tenant?.id : doc.tenant
      const tenant = tenantId
        ? await req.payload.findByID({ collection: 'tenants', id: tenantId, depth: 0, req }).catch(() => null)
        : null
      const clinicLocation = tenant?.contact?.address || 'Clinical Suite, Manila'
      const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '')

      // Build Unified Attendee Manifest (1-Column Pattern)
      const attendees: { name: string; service: string; isPrimary: boolean }[] = []

      // Add Primary Booker
      const primaryServiceName =
        typeof doc.service === 'object'
          ? doc.service?.title || doc.service?.name || 'Scheduled Procedure'
          : 'Scheduled Procedure'

      attendees.push({
        name: `${doc.firstName} ${doc.surname}`,
        service: primaryServiceName,
        isPrimary: true,
      })

      // Add Guests (if applicable)
      if (doc.bookingGroupId) {
        const accompanying = await req.payload.find({
          collection: 'appointments',
          req, // Share transaction
          where: {
            and: [
              { bookingGroupId: { equals: doc.bookingGroupId } },
              { isGuest: { equals: true } },
            ],
          },
        })

        accompanying.docs.forEach((g) => {
          attendees.push({
            name: `${g.firstName} ${g.surname}`,
            service: typeof g.service === 'object' ? g.service?.title : 'Procedure',
            isPrimary: false,
          })
        })
      }

      // Dispatch Transactional Email using the 1-Column Template
      await req.payload.sendEmail({
        to: doc.email,
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        subject: `Booking Confirmed: ${doc.firstName} ${doc.surname}`,
        html: getEmailHtml(
          doc.firstName,
          displayDate,
          displayTime,
          'confirmation',
          clinicLocation,
          attendees,
          tenant ? { clinicName: tenant.name, statusUrl: `${siteUrl}/${tenant.slug}/booking/status` } : {},
        ),
      })

      // Update the LED flag
      await req.payload.update({
        collection: 'appointments',
        id: doc.id,
        req, // Share transaction
        data: {
          emailStatus: {
            ...doc.emailStatus,
            confirmationSent: true,
          },
        },
        // @ts-expect-error - disableHooks exists at runtime in Payload 3.0
        disableHooks: true,
      })

      req.payload.logger.info(`[Dispatch] Confirmation successful for ${doc.email}`)
    } catch (err) {
      req.payload.logger.error(`[Dispatch Error] ${err}`)
    }
  }
}
