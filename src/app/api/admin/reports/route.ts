import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import dayjs from '@/lib/dayjs'

export const dynamic = 'force-dynamic'

// --- 1. DEFINE INTERFACES ---

interface AppointmentReportDoc {
  id: string | number
  firstName: string
  surname: string
  email?: string
  phone?: string
  appointmentDate: string
  status: 'confirmed' | 'completed' | 'pending' | 'cancelled'
  price?: number | string
  service?:
    | {
        title: string
        price?: number | string
      }
    | number
    | string
    | null
}

interface FormattedReportEntry {
  rawDate: string
  date: string
  patient: string
  email: string
  phone: string
  service: string
  price: number
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'thisMonth'
    const selectedMonth = parseInt(searchParams.get('month') || '0', 10)

    const nowPHT = dayjs().tz('Asia/Manila')
    let dbStart: dayjs.Dayjs, dbEnd: dayjs.Dayjs

    if (range === 'thisMonth') {
      dbStart = nowPHT.startOf('month')
      dbEnd = nowPHT.endOf('month')
    } else if (range === 'specificMonth') {
      dbStart = nowPHT.month(selectedMonth).startOf('month')
      dbEnd = nowPHT.month(selectedMonth).endOf('month')
    } else if (range === 'ytd') {
      dbStart = nowPHT.startOf('year')
      dbEnd = nowPHT.endOf('day')
    } else {
      dbStart = dayjs('2020-01-01')
      dbEnd = dayjs('2100-01-01')
    }

    const payload = await getPayload({ config })

    const { docs: rawDocs } = await payload.find({
      collection: 'appointments',
      where: {
        and: [
          { appointmentDate: { greater_than_equal: dbStart.toISOString() } },
          { appointmentDate: { less_than_equal: dbEnd.toISOString() } },
          { status: { equals: 'completed' } },
        ],
      },
      limit: 5000,
      sort: 'appointmentDate',
      depth: 1, // Ensure we get service titles and prices
    })

    const docs = rawDocs as unknown as AppointmentReportDoc[]

    // 2. Format the raw ledger
    const reports: FormattedReportEntry[] = docs.map((doc) => {
      const serviceObj = typeof doc.service === 'object' ? doc.service : null
      const rawPrice = serviceObj?.price ?? doc.price ?? 0

      return {
        rawDate: doc.appointmentDate,
        date: dayjs(doc.appointmentDate).tz('Asia/Manila').format('MMM D, YYYY - hh:mm A'),
        patient: `${doc.firstName} ${doc.surname}`,
        email: doc.email || 'N/A',
        phone: doc.phone || 'N/A',
        service: serviceObj?.title || 'General Consultation',
        price: Number(rawPrice),
      }
    })

    // 3. Aggregate Data
    let totalRevenue = 0
    const categoryMap = new Map<string, number>()
    const monthlyMap = new Map<
      string,
      { revenue: number; sessions: number; categories: Map<string, number> }
    >()

    reports.forEach((r) => {
      totalRevenue += r.price
      categoryMap.set(r.service, (categoryMap.get(r.service) || 0) + r.price)

      if (range === 'ytd' || range === 'all') {
        const monthLabel = dayjs(r.rawDate).tz('Asia/Manila').format('MMMM YYYY')
        if (!monthlyMap.has(monthLabel)) {
          monthlyMap.set(monthLabel, { revenue: 0, sessions: 0, categories: new Map() })
        }
        const monthData = monthlyMap.get(monthLabel)!
        monthData.revenue += r.price
        monthData.sessions += 1
        monthData.categories.set(r.service, (monthData.categories.get(r.service) || 0) + r.price)
      }
    })

    const overallCategorySales = Array.from(categoryMap.entries())
      .map(([service, total]) => ({ service, total }))
      .sort((a, b) => b.total - a.total)

    const monthlyReports = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      sessions: data.sessions,
      categorySales: Array.from(data.categories.entries())
        .map(([service, total]) => ({ service, total }))
        .sort((a, b) => b.total - a.total),
    }))

    return NextResponse.json({
      reports,
      summary: {
        totalRevenue,
        totalSessions: reports.length,
        overallCategorySales,
        monthlyReports,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('🚨 REPORTS API ERROR:', message)
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 })
  }
}
