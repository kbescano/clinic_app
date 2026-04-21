import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import dayjs from '@/lib/dayjs'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || 'today'

  const nowPHT = dayjs().tz('Asia/Manila')
  let dbStart, dbEnd, prevStart, prevEnd

  if (range === 'today') {
    dbStart = nowPHT.startOf('day')
    dbEnd = nowPHT.endOf('day')
    prevStart = nowPHT.subtract(1, 'day').startOf('day')
    prevEnd = nowPHT.subtract(1, 'day').endOf('day')
  } else if (range === 'thisWeek') {
    // BULLETPROOF MONDAY START: No plugins required.
    // .day() returns 0 for Sunday, 1 for Monday, etc.
    const currentDay = nowPHT.day()
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1

    dbStart = nowPHT.subtract(diffToMonday, 'day').startOf('day') // This Monday at 00:00:00
    dbEnd = dbStart.add(6, 'day').endOf('day') // This Sunday at 23:59:59

    prevStart = dbStart.subtract(7, 'day') // Last Monday
    prevEnd = dbEnd.subtract(7, 'day') // Last Sunday
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

  if (currentData.docs.length > 0) {
    console.log('Sample Document:', JSON.stringify(currentData.docs[0], null, 2))
  }

  const calculateRevenue = (docs: any[]) =>
    docs.reduce((sum, doc) => {
      // ONLY calculate revenue if the status is completed
      if (doc.status !== 'completed') return sum

      const rawPrice = doc.service?.price || doc.price || 0
      const numericPrice = Number(rawPrice) || 0
      return sum + numericPrice
    }, 0)

  const periodRevenue = calculateRevenue(currentData.docs)
  const prevPeriodRevenue = calculateRevenue(previousData.docs)

  let growth = 0
  if (prevPeriodRevenue > 0) {
    growth = Math.round(((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100)
  } else if (periodRevenue > 0) {
    growth = 100
  }

  const categorySales: Record<string, number> = {}
  currentData.docs.forEach((doc: any) => {
    // ONLY tally category sales if the status is completed
    if (doc.status !== 'completed') return

    const serviceName = doc.service?.title || 'General Consultation'
    const rawPrice = doc.service?.price || doc.price || 0
    const price = Number(rawPrice) || 0

    if (!categorySales[serviceName]) {
      categorySales[serviceName] = 0
    }
    categorySales[serviceName] += price
  })

  const sortedCategorySales = Object.fromEntries(
    Object.entries(categorySales).sort(([, a], [, b]) => b - a),
  )

  const recent = currentData.docs
    .filter((doc: any) => doc.status === 'completed') // Filter completed status first
    .slice(0, 8) // Then grab the latest 8
    .map((doc: any) => ({
      id: doc.id,
      firstName: doc.firstName,
      surname: doc.surname,
      service: doc.service?.title || 'General Consultation',
      price: Number(doc.service?.price || doc.price || 0),
      time: dayjs(doc.appointmentDate).tz('Asia/Manila').format('hh:mm A'),
      date: dayjs(doc.appointmentDate).tz('Asia/Manila').format('MMM D, YYYY'),
    }))

  return NextResponse.json({
    periodRevenue,
    prevPeriodRevenue,
    growth,
    categorySales: sortedCategorySales,
    totalAppointments: currentData.totalDocs, // Total sessions still counts everything not cancelled
    recent,
  })
}
