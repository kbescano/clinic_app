import { getPayload } from 'payload'
import config from '@/payload.config'
import SpecialistDashboardClient from './DashboardClient'
import dayjs from '@/lib/dayjs'

export const dynamic = 'force-dynamic'

export default async function SpecialistDashboardPage() {
  const payload = await getPayload({ config })
  const now = dayjs().tz('Asia/Manila')
  const todayStart = now.startOf('day').toISOString()
  const todayEnd = now.endOf('day').toISOString()
  const next7Days = now.add(7, 'day').endOf('day').toISOString()

  const [todayRaw, weekRaw] = await Promise.all([
    payload.find({
      collection: 'appointments',
      where: { appointmentDate: { greater_than_equal: todayStart, less_than_equal: todayEnd } },
      sort: 'appointmentDate',
      depth: 1,
      limit: 100,
    }),
    payload.find({
      collection: 'appointments',
      where: { appointmentDate: { greater_than: todayEnd, less_than_equal: next7Days } },
      sort: 'appointmentDate',
      depth: 1,
      limit: 100,
    }),
  ])

  // --- REVENUE LOGIC ---
  const metrics = (todayRaw.docs as any[]).reduce(
    (acc, raw) => {
      const status = raw.status
      const price = Number(raw.service?.price) || 0
      const title = raw.service?.title || 'General Consultation'
      if (status === 'cancelled' || status === 'pending') return acc
      acc.serviceCounts[title] = (acc.serviceCounts[title] || 0) + 1
      acc.projectedRevenue += price
      if (status === 'completed') {
        acc.settledRevenue += price
        acc.totalCompletedServices += 1
      }
      return acc
    },
    {
      serviceCounts: {} as Record<string, number>,
      projectedRevenue: 0,
      settledRevenue: 0,
      totalCompletedServices: 0,
    },
  )

  const totalManifestWorkload = Object.values(metrics.serviceCounts).reduce(
    (a: number, b) => a + (b as number),
    0,
  )

  return (
    <SpecialistDashboardClient
      todayData={groupAppointments(todayRaw.docs as any)}
      weekData={groupAppointments(weekRaw.docs as any)}
      metrics={{
        ...metrics,
        pendingRevenue: metrics.projectedRevenue - metrics.settledRevenue,
        completionRate:
          totalManifestWorkload > 0
            ? Math.round((metrics.totalCompletedServices / totalManifestWorkload) * 100)
            : 0,
        totalManifestWorkload,
      }}
    />
  )
}

// --- HELPER (Same as provided logic) ---
function groupAppointments(docs: any[]): any[] {
  const grouped = docs.reduce((acc: any, curr) => {
    const key = `${curr.firstName}-${curr.surname}-${curr.phone}-${dayjs(curr.appointmentDate).toISOString()}`
    if (!acc[key]) acc[key] = { ...curr, services: [curr.service?.title || 'General Consultation'] }
    else acc[key].services.push(curr.service?.title || 'General Consultation')
    return acc
  }, {})
  return Object.values(grouped).sort((a: any, b: any) =>
    dayjs(a.appointmentDate).isBefore(dayjs(b.appointmentDate)) ? -1 : 1,
  )
}
