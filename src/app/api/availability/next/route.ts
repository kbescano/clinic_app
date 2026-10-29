import { NextResponse } from 'next/server'
import dayjs from '@/lib/dayjs'
import { getBusySlots, getClinicTimeSlots } from '@/app/(website)/booking/actions'

export const dynamic = 'force-dynamic'

// Public and anonymous: it reveals one open time, never who holds the others. Cached at the CDN for
// a minute so a busy home page does not turn into a busy database.
const CACHE = { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' }
const SEARCH_DAYS = 7

/** The earliest bookable slot, using the same rules as the booking form. */
export async function GET() {
  try {
    const now = dayjs().tz('Asia/Manila')
    const today = now.format('YYYY-MM-DD')
    const tomorrow = now.add(1, 'day').format('YYYY-MM-DD')
    // After 15:00 the form stops offering same-day slots.
    const first = now.hour() >= 15 ? now.add(1, 'day') : now
    const slots = await getClinicTimeSlots()

    for (let i = 0; i < SEARCH_DAYS; i++) {
      const day = first.add(i, 'day')
      const date = day.format('YYYY-MM-DD')
      const busy = new Set(await getBusySlots(date))
      const free = slots.find((slot) => !busy.has(slot) && !(date === today && slot <= now.format('HH:mm')))
      if (!free) continue

      return NextResponse.json(
        {
          date,
          time: free,
          dayLabel: date === today ? 'Today' : date === tomorrow ? 'Tomorrow' : day.format('ddd, MMM D'),
          timeLabel: dayjs(`${date}T${free}`).format('h:mm A'),
        },
        { headers: CACHE },
      )
    }
    return NextResponse.json(null, { headers: CACHE })
  } catch (error) {
    console.error('Next availability lookup failed:', error)
    return NextResponse.json(null, { status: 500 })
  }
}
