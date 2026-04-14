import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'
import dayjs from '@/lib/dayjs'

export const dynamic = 'force-dynamic'

// --- 1. DEFINE ANALYTICS INTERFACES ---

interface Service {
  title: string
  price: number
}

interface Appointment {
  id: string
  firstName: string
  surname: string
  appointmentDate: string
  status: 'confirmed' | 'cancelled' | 'pending' | 'completed'
  service?: Service // Populated via depth: 1
}

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || 'thisMonth'

  const nowPHT = dayjs().tz('Asia/Manila')

  // Determine Current and Previous Period Boundaries
  let start = nowPHT.startOf('month')
  const end = nowPHT.endOf('day')
  let prevStart = nowPHT.subtract(1, 'month').startOf('month')
  let prevEnd = nowPHT.subtract(1, 'month').endOf('month')

  if (range === 'today') {
    start = nowPHT.startOf('day')
    prevStart = nowPHT.subtract(1, 'day').startOf('day')
    prevEnd = nowPHT.subtract(1, 'day').endOf('day')
  } else if (range === '7days') {
    start = nowPHT.subtract(7, 'day').startOf('day')
    prevStart = nowPHT.subtract(14, 'day').startOf('day')
    prevEnd = nowPHT.subtract(7, 'day').endOf('day')
  } else if (range === 'all') {
    start = dayjs('2020-01-01').tz('Asia/Manila')
    prevStart = start
    prevEnd = start
  }

  try {
    // 2. Fetch Data with depth for service prices/titles
    const [currentResult, prevResult] = await Promise.all([
      payload.find({
        collection: 'appointments',
        where: {
          and: [
            { status: { equals: 'completed' } },
            { appointmentDate: { greater_than_equal: start.toISOString() } },
            { appointmentDate: { less_than_equal: end.toISOString() } },
          ],
        },
        sort: '-appointmentDate',
        limit: 1000,
        depth: 1,
      }),
      payload.find({
        collection: 'appointments',
        where: {
          and: [
            { status: { equals: 'completed' } },
            { appointmentDate: { greater_than_equal: prevStart.toISOString() } },
            { appointmentDate: { less_than_equal: prevEnd.toISOString() } },
          ],
        },
        limit: 1000,
        depth: 1, // Depth 1 is needed here too for prevPeriodRevenue
      }),
    ])

    // 3. Cast results to our local interfaces
    const currentDocs = currentResult.docs as unknown as Appointment[]
    const prevDocs = prevResult.docs as unknown as Appointment[]

    // --- CALCULATIONS ---
    const periodRevenue = currentDocs.reduce((sum, a) => sum + (a.service?.price || 0), 0)
    const prevPeriodRevenue = prevDocs.reduce((sum, a) => sum + (a.service?.price || 0), 0)

    // Calculate Growth Percentage
    // Formula: $$\text{growth} = \frac{\text{periodRevenue} - \text{prevPeriodRevenue}}{\text{prevPeriodRevenue}} \times 100$$
    let growth = 0
    if (prevPeriodRevenue > 0) {
      growth = ((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100
    } else if (periodRevenue > 0) {
      growth = 100
    }

    // Category Distribution
    const categorySales: Record<string, number> = {}
    currentDocs.forEach((a) => {
      const category = a.service?.title || 'Unknown'
      const price = a.service?.price || 0
      categorySales[category] = (categorySales[category] || 0) + price
    })

    // Format Top 5 Recent
    const recent = currentDocs.slice(0, 5).map((a) => ({
      id: a.id,
      firstName: a.firstName,
      surname: a.surname,
      service: a.service?.title || 'Unknown',
      price: a.service?.price || 0,
      time: dayjs(a.appointmentDate).tz('Asia/Manila').format('hh:mm A'),
      date: dayjs(a.appointmentDate).tz('Asia/Manila').format('MMM D'),
    }))

    return NextResponse.json({
      periodRevenue,
      prevPeriodRevenue,
      growth: parseFloat(growth.toFixed(1)),
      categorySales,
      recent,
      totalAppointments: currentDocs.length,
    })
  } catch (err) {
    console.error('Analytics Route Error:', err)
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}
