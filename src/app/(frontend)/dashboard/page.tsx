import { getPayload } from 'payload'
import config from '@/payload.config'
import SpecialistDashboardClient from './DashboardClient'
import dayjs from '@/lib/dayjs'

export const dynamic = 'force-dynamic'

// --- TYPES & INTERFACES ---

interface AppointmentDoc {
  id: string
  status: 'confirmed' | 'cancelled' | 'pending' | 'completed'
  firstName: string
  surname: string
  phone: string
  email: string // <--- ADD THIS LINE
  appointmentDate: string
  service?: {
    title: string
    price: number
  }
}

// GroupedAppointment now automatically includes 'email' because it's in AppointmentDoc
interface GroupedAppointment extends Omit<AppointmentDoc, 'service'> {
  services: string[]
}

interface DashboardMetrics {
  serviceCounts: Record<string, number>
  projectedRevenue: number
  settledRevenue: number
  totalCompletedServices: number
  pendingRevenue: number
  completionRate: number
  totalManifestWorkload: number
}

// --- 1. UPDATED HELPER: Typed Metrics Logic ---
function calculateMetrics(docs: AppointmentDoc[]): DashboardMetrics {
  const metrics = docs.reduce(
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
    (a: number, b) => a + b,
    0,
  )

  return {
    ...metrics,
    pendingRevenue: metrics.projectedRevenue - metrics.settledRevenue,
    completionRate:
      totalManifestWorkload > 0
        ? Math.round((metrics.totalCompletedServices / totalManifestWorkload) * 100)
        : 0,
    totalManifestWorkload,
  }
}

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

  // Cast Payload docs to our local interface
  const todayDocs = todayRaw.docs as unknown as AppointmentDoc[]
  const weekDocs = weekRaw.docs as unknown as AppointmentDoc[]

  // --- 2. CALCULATE BOTH SETS OF METRICS ---
  const todayMetrics = calculateMetrics(todayDocs)
  const weekMetrics = calculateMetrics(weekDocs)

  return (
    <SpecialistDashboardClient
      todayData={groupAppointments(todayDocs)}
      weekData={groupAppointments(weekDocs)}
      todayMetrics={todayMetrics}
      weekMetrics={weekMetrics}
    />
  )
}

// --- 3. UPDATED HELPER: Typed Grouping ---
function groupAppointments(docs: AppointmentDoc[]): GroupedAppointment[] {
  const grouped = docs.reduce((acc: Record<string, GroupedAppointment>, curr) => {
    // people who happen to have the same name/phone but different emails.
    const key = `${curr.firstName}-${curr.surname}-${curr.email}-${dayjs(curr.appointmentDate).toISOString()}`

    if (!acc[key]) {
      acc[key] = {
        ...curr,
        services: [curr.service?.title || 'General Consultation'],
      }
    } else {
      acc[key].services.push(curr.service?.title || 'General Consultation')
    }
    return acc
  }, {})

  return Object.values(grouped).sort((a, b) =>
    dayjs(a.appointmentDate).isBefore(dayjs(b.appointmentDate)) ? -1 : 1,
  )
}
