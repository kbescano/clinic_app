import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'
import dayjs from '@/lib/dayjs'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || 'thisMonth'

  const nowPHT = dayjs().tz('Asia/Manila')

  // 1. Determine Current and Previous Period Boundaries
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
    start = dayjs('2020-01-01').tz('Asia/Manila') // Arbitrary past date
    prevStart = start
    prevEnd = start
  }

  try {
    // 2. Fetch Current Period Data
    const currentResult = await payload.find({
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
    })

    // 3. Fetch Previous Period Data (For Growth Calculation)
    const prevResult = await payload.find({
      collection: 'appointments',
      where: {
        and: [
          { status: { equals: 'completed' } },
          { appointmentDate: { greater_than_equal: prevStart.toISOString() } },
          { appointmentDate: { less_than_equal: prevEnd.toISOString() } },
        ],
      },
      limit: 1000,
      depth: 0,
    })

    const currentDocs = currentResult.docs as any[]
    const prevDocs = prevResult.docs as any[]

    // --- CALCULATIONS ---
    const periodRevenue = currentDocs.reduce((sum, a) => sum + (a.service?.price || 0), 0)
    const prevPeriodRevenue = prevDocs.reduce((sum, a) => sum + (a.service?.price || 0), 0)

    // Calculate Growth Percentage
    let growth = 0
    if (prevPeriodRevenue > 0) {
      growth = ((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100
    } else if (periodRevenue > 0) {
      growth = 100 // 100% growth if previous period was 0
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
      growth: parseFloat(growth.toFixed(1)), // Round to 1 decimal
      categorySales,
      recent,
      totalAppointments: currentDocs.length,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}
