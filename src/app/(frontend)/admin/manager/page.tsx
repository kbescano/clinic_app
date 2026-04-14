import { getPayload } from 'payload'
import { Where } from 'payload'
import config from '@/payload.config'
import AdminManagementClient from './AdminManagementClient'
import dayjs from '@/lib/dayjs'

export const dynamic = 'force-dynamic'

interface SearchParams {
  range?: string
  status?: string
}

interface AppointmentDoc {
  id: string
  appointmentDate: string
  status: string
  firstName: string
  surname: string
  email: string
  phone: string
  service?: {
    title: string
  }
  isGuest?: boolean
  emailStatus?: {
    confirmationSent?: boolean
    reminder24hSent?: boolean
    reminder2hSent?: boolean
  }
}

export default async function AdminManagementPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams
  const range = searchParams.range || 'today'
  const status = searchParams.status || 'all'

  const payload = await getPayload({ config })

  const specialistsData = await payload.find({
    collection: 'specialists',
    limit: 100, // Fetch up to 100 active specialists
    overrideAccess: true,
  })

  const nowPHT = dayjs().tz('Asia/Manila')
  const startOfToday = nowPHT.startOf('day').toISOString()
  const endOfToday = nowPHT.endOf('day').toISOString()

  let dbStart = startOfToday
  let dbEnd = nowPHT.endOf('day').add(7, 'day').toISOString()
  let secondaryLabel = 'Upcoming 7 Days'

  if (range === 'today') {
    dbEnd = endOfToday
  } else if (range === 'thisMonth') {
    dbStart = nowPHT.startOf('month').toISOString()
    dbEnd = nowPHT.endOf('month').toISOString()
    secondaryLabel = 'Monthly Roster'
  } else if (range === 'all') {
    dbStart = dayjs('2020-01-01').toISOString()
    dbEnd = dayjs('2100-01-01').toISOString()
    secondaryLabel = 'Archive Registry'
  }

  // 2. Change the type from Record to Where[]
  const whereConditions: Where[] = [
    { appointmentDate: { greater_than_equal: dbStart } },
    { appointmentDate: { less_than_equal: dbEnd } },
  ]

  if (status !== 'all') {
    whereConditions.push({ status: { equals: status } })
  }

  const data = await payload.find({
    collection: 'appointments',
    where: { and: whereConditions },
    sort: 'appointmentDate',
    limit: 500,
  })

  const appointments = data.docs as unknown as AppointmentDoc[]

  const todayRaw = appointments.filter(
    (a) => a.appointmentDate >= startOfToday && a.appointmentDate <= endOfToday,
  )
  const otherRaw = appointments.filter(
    (a) => a.appointmentDate < startOfToday || a.appointmentDate > endOfToday,
  )

  const mapToClient = (a: AppointmentDoc) => ({
    ...a,
    services: [a.service?.title || 'General Consultation'],
  })

  return (
    <AdminManagementClient
      todayData={todayRaw.map(mapToClient)}
      otherData={otherRaw.map(mapToClient)}
      range={range}
      status={status}
      secondaryLabel={secondaryLabel}
      specialists={specialistsData.docs}
    />
  )
}
