import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import dayjs from '@/lib/dayjs'

export const dynamic = 'force-dynamic'

// --- 1. DEFINE INTERFACES ---

interface AppointmentDoc {
  id: string | number
  status: 'confirmed' | 'completed' | 'pending' | 'cancelled'
  firstName: string
  surname: string
  appointmentDate: string
  price?: number | string // Fallback price on the doc
  service?:
    | {
        title: string
        price?: number | string
      }
    | number
    | string
    | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || 'today'

  const nowPHT = dayjs().tz('Asia/Manila')
  let dbStart: dayjs.Dayjs, dbEnd: dayjs.Dayjs, prevStart: dayjs.Dayjs, prevEnd: dayjs.Dayjs

  if (range === 'today') {
    dbStart = nowPHT.startOf('day')
    dbEnd = nowPHT.endOf('day')
    prevStart = nowPHT.subtract(1, 'day').startOf('day')
    prevEnd = nowPHT.subtract(1, 'day').endOf('day')
  } else if (range === 'thisWeek') {
    const currentDay = nowPHT.day()
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1
    dbStart = nowPHT.subtract(diffToMonday, 'day').startOf('day')
    dbEnd = dbStart.add(6, 'day').endOf('day')
    prevStart = dbStart.subtract(7, 'day')
    prevEnd = dbEnd.subtract(7, 'day')
  } else if (range === 'thisMonth') {
    dbStart = nowPHT.startOf('month')
    dbEnd = nowPHT.endOf('month')
    prevStart = nowPHT.subtract(1, 'month').startOf('month')
    prevEnd = nowPHT.subtract(1, 'month').endOf('month')
  } else if (range === 'ytd') {
    dbStart = nowPHT.startOf('year')
    dbEnd = nowPHT.endOf('day')
    prevStart = nowPHT.subtract(1, 'year').startOf('year')
    prevEnd = nowPHT.subtract(1, 'year').endOf('day')
  } else {
    dbStart = dayjs('2020-01-01')
    dbEnd = dayjs('2100-01-01')
    prevStart = dayjs('2020-01-01')
    prevEnd = dayjs('2020-01-01')
  }

  const payload = await getPayload({ config })

  // --- 2. FETCH DATA WITH TYPES ---
  const currentData = await payload.find({
    collection: 'appointments',
    where: {
      and: [
        { appointmentDate: { greater_than_equal: dbStart.toISOString() } },
        { appointmentDate: { less_than_equal: dbEnd.toISOString() } },
        { status: { not_equals: 'cancelled' } },
      ],
    },
    limit: 1000,
    sort: '-appointmentDate',
    depth: 1, // Ensure we can see service.title and service.price
  })

  const previousData = await payload.find({
    collection: 'appointments',
    where: {
      and: [
        { appointmentDate: { greater_than_equal: prevStart.toISOString() } },
        { appointmentDate: { less_than_equal: prevEnd.toISOString() } },
        { status: { not_equals: 'cancelled' } },
      ],
    },
    limit: 1000,
  })

  const currentDocs = currentData.docs as unknown as AppointmentDoc[]
  const previousDocs = previousData.docs as unknown as AppointmentDoc[]

  // --- 3. REVENUE CALCULATION HELPER ---
  const calculateRevenue = (docs: AppointmentDoc[]) =>
    docs.reduce((sum, doc) => {
      if (doc.status !== 'completed') return sum

      // Safe extraction of price from nested service or root doc
      const servicePrice = typeof doc.service === 'object' ? doc.service?.price : null
      const rawPrice = servicePrice ?? doc.price ?? 0

      return sum + (Number(rawPrice) || 0)
    }, 0)

  const periodRevenue = calculateRevenue(currentDocs)
  const prevPeriodRevenue = calculateRevenue(previousDocs)

  let growth = 0
  if (prevPeriodRevenue > 0) {
    growth = Math.round(((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100)
  } else if (periodRevenue > 0) {
    growth = 100
  }

  // --- 4. TALLY CATEGORY SALES ---
  const categorySales: Record<string, number> = {}
  currentDocs.forEach((doc) => {
    if (doc.status !== 'completed') return

    const serviceName =
      (typeof doc.service === 'object' ? doc.service?.title : null) || 'General Consultation'
    const servicePrice = typeof doc.service === 'object' ? doc.service?.price : null
    const price = Number(servicePrice ?? doc.price ?? 0)

    if (!categorySales[serviceName]) {
      categorySales[serviceName] = 0
    }
    categorySales[serviceName] += price
  })

  const sortedCategorySales = Object.fromEntries(
    Object.entries(categorySales).sort(([, a], [, b]) => b - a),
  )

  // --- 5. RECENT COMPLETED APPOINTMENTS ---
  const recent = currentDocs
    .filter((doc) => doc.status === 'completed')
    .slice(0, 8)
    .map((doc) => {
      const serviceObj = typeof doc.service === 'object' ? doc.service : null
      return {
        id: doc.id,
        firstName: doc.firstName,
        surname: doc.surname,
        service: serviceObj?.title || 'General Consultation',
        price: Number(serviceObj?.price || doc.price || 0),
        time: dayjs(doc.appointmentDate).tz('Asia/Manila').format('hh:mm A'),
        date: dayjs(doc.appointmentDate).tz('Asia/Manila').format('MMM D, YYYY'),
      }
    })

  return NextResponse.json({
    periodRevenue,
    prevPeriodRevenue,
    growth,
    categorySales: sortedCategorySales,
    totalAppointments: currentData.totalDocs,
    recent,
  })
}
