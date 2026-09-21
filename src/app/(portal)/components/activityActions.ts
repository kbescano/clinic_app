'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import dayjs from '@/lib/dayjs'
import { getStaffUser } from '@/lib/auth'

interface ActivityDoc {
  id: string
  firstName: string
  surname: string
  phone: string
  appointmentDate: string
  isGuest?: boolean
  service?: number | { id: string | number; title: string }
  createdAt: string
}

export async function getLatestActivity() {
  // Patient names and phone numbers: staff only.
  if (!(await getStaffUser())) return []

  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'appointments',
    sort: '-createdAt',
    limit: 10,
    overrideAccess: true,
    depth: 1,
  })

  return result.docs.map((doc) => {
    const appt = doc as unknown as ActivityDoc
    return {
      id: String(appt.id),
      bookerName: appt.isGuest
        ? `${appt.firstName} ${appt.surname} (Guest)`
        : `${appt.firstName} ${appt.surname}`,
      phone: appt.phone,
      service: typeof appt.service === 'object' ? appt.service.title : 'Treatment',
      scheduleDate: dayjs(appt.appointmentDate).tz('Asia/Manila').format('MMM D • hh:mm A'),
      timestamp: appt.createdAt,
    }
  })
}
