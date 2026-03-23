import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'

export async function GET() {
  const payload = await getPayload({ config })
  const now = new Date()

  // 1. Setup Time Ranges
  const startOfToday = new Date(now.setHours(0, 0, 0, 0)).toISOString()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const startOfWeek = sevenDaysAgo.toISOString()

  try {
    // 2. Fetch DATA for Totals (Last 30 days)
    const statsResult = await payload.find({
      collection: 'appointments',
      where: {
        and: [
          { status: { equals: 'completed' } },
          { appointmentDate: { greater_than_equal: startOfMonth } },
        ],
      },
      depth: 1,
      limit: 1000,
    })

    const docs = statsResult.docs as any[]

    // 3. Fetch DATA for Sidebar (Last 5 Recent)
    const recentResult = await payload.find({
      collection: 'appointments',
      where: { status: { equals: 'completed' } },
      sort: '-appointmentDate', // Newest first
      limit: 5,
      depth: 1,
    })

    // --- CALCULATIONS ---

    const dailySales = docs
      .filter((a) => new Date(a.appointmentDate) >= new Date(startOfToday))
      .reduce((sum, a) => sum + (a.service?.price || 0), 0)

    const monthlySales = docs.reduce((sum, a) => sum + (a.service?.price || 0), 0)

    const weeklyCategorySales: Record<string, number> = {}
    docs
      .filter((a) => new Date(a.appointmentDate) >= new Date(startOfWeek))
      .forEach((a) => {
        const category = a.service?.title
        const price = a.service?.price || 0
        weeklyCategorySales[category] = (weeklyCategorySales[category] || 0) + price
      })

    // 4. Map Sidebar Data for Frontend
    const recent = recentResult.docs.map((a: any) => ({
      id: a.id,
      firstName: a.firstName,
      surname: a.surname,
      service: a.service?.title || 'Unknown',
      price: a.service?.price || 0,
      time: new Date(a.appointmentDate).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }))

    return NextResponse.json({
      dailySales,
      monthlySales,
      weeklyCategorySales,
      recent,
    })
  } catch (error) {
    console.error('Analytics API Error:', error)
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}
