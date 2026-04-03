import { getPayload } from 'payload'
import config from '@/payload.config'
import AdminManagementClient from './AdminManagementClient'
import dayjs from '@/lib/dayjs'

export const dynamic = 'force-dynamic'

export default async function AdminManagementPage(props: { searchParams?: Promise<any> | any }) {
  const searchParams = await props.searchParams
  const range = searchParams?.range || 'today'
  const status = searchParams?.status || 'all'

  const payload = await getPayload({ config })
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

  const whereConditions: any[] = [
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

  const appointments = data.docs
  const todayRaw = appointments.filter(
    (a: any) => a.appointmentDate >= startOfToday && a.appointmentDate <= endOfToday,
  )
  const otherRaw = appointments.filter(
    (a: any) => a.appointmentDate < startOfToday || a.appointmentDate > endOfToday,
  )

  return (
    <AdminManagementClient
      todayData={todayRaw.map((a: any) => ({
        ...a,
        services: [a.service?.title || 'General Consultation'],
      }))}
      otherData={otherRaw.map((a: any) => ({
        ...a,
        services: [a.service?.title || 'General Consultation'],
      }))}
      range={range}
      status={status}
      secondaryLabel={secondaryLabel}
    />
  )
}
