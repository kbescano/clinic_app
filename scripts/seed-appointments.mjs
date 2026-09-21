// Seeds realistic test appointments for one month.
//
//   node scripts/seed-appointments.mjs 2026-09              insert
//   node scripts/seed-appointments.mjs 2026-09 --dry-run    print the plan, write nothing
//   node scripts/seed-appointments.mjs 2026-09 --replace    delete this month's seeded rows first
//
// Every row gets booking_group_id 'SEED-YYYYMM-…', so seeded data is trivially identifiable:
//   delete from appointments where booking_group_id like 'SEED-%';
//
// It follows the booking rules in the `booking-config` global (hours, lunch, slot interval,
// capacity) and the real durations/prices in `services`, so the calendar, dashboard, history and
// analytics pages all get coherent data. Inserts go straight to Postgres, bypassing Payload hooks
// (no confirmation emails, no cache revalidation). `pg` comes in through @payloadcms/db-postgres.
import 'dotenv/config'
import pg from 'pg'

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const monthArg = args.find((a) => /^\d{4}-\d{2}$/.test(a))
const DRY_RUN = flags.has('--dry-run')
const REPLACE = flags.has('--replace')

const TZ_OFFSET = '+08:00' // Asia/Manila, no DST
const nowManila = new Date()
const defaultMonth = new Date(nowManila.getTime() + 8 * 3600_000).toISOString().slice(0, 7)
const month = monthArg ?? defaultMonth
const [year, monthNum] = month.split('-').map(Number)
const marker = `SEED-${year}${String(monthNum).padStart(2, '0')}`

// --- deterministic randomness: the same month always yields the same plan ---------------------
function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(year * 100 + monthNum)
const pick = (list) => list[Math.floor(rand() * list.length)]
const chance = (p) => rand() < p
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1))

// --- fictional patients (example.com never delivers mail) --------------------------------------
const FIRST = ['Juan', 'Maria', 'Jose', 'Ana', 'Miguel', 'Sofia', 'Carlo', 'Isabel', 'Rafael', 'Camille', 'Paolo', 'Bianca', 'Luis', 'Angela', 'Gabriel', 'Patricia']
const LAST = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Bautista', 'Ramos', 'Villanueva', 'Aquino', 'Castillo', 'Navarro', 'Domingo']
const patients = Array.from({ length: 44 }, (_, i) => {
  const first = FIRST[i % FIRST.length]
  const last = LAST[(i * 5 + Math.floor(i / FIRST.length)) % LAST.length]
  const slug = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '')
  return { first, last, email: `${slug}${i}@example.com`, phone: `0917000${String(1000 + i * 37).slice(-4)}` }
})
// Skewed pick so some patients return several times in the month.
const pickPatient = () => patients[Math.floor(Math.pow(rand(), 1.6) * patients.length)]

const NOTES = [
  'Skin responded well. Advise SPF 50 daily and follow up in 4 weeks.',
  'Mild redness after treatment, expected to settle within 24 hours.',
  'Patient reports improved texture. Continue current routine.',
  'Discussed maintenance plan; next session recommended in 2 weeks.',
  'Sensitivity noted around the cheeks. Use gentle cleanser only.',
  'No adverse reaction. Patient satisfied with results.',
]

// --- helpers ------------------------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0')
const toMin = (hhmm) => Number(hhmm.split(':')[0]) * 60 + Number(hhmm.split(':')[1])
const stamp = (dateStr, minutes) => `${dateStr}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00${TZ_OFFSET}`
const dayOfWeek = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = Sunday
const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate()

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
  await client.connect()

  try {
    const cfgRow = (await client.query('select * from booking_config limit 1')).rows[0] ?? {}
    const open = toMin(cfgRow.opening_time ?? '09:00')
    const close = toMin(cfgRow.closing_time ?? '17:00')
    const interval = Number(cfgRow.slot_interval) || 30
    const capacity = Number(cfgRow.specialist_capacity) || 1
    const lunchStart = toMin(cfgRow.lunch_break_start ?? '12:00')
    const lunchEnd = toMin(cfgRow.lunch_break_end ?? '13:00')

    const services = (await client.query('select id, title, duration, price from services order by id')).rows.map(
      (s) => ({ id: s.id, title: s.title, duration: Number(s.duration) || 60, price: Number(s.price) || 0 }),
    )
    const specialists = (await client.query('select id from specialists order by id')).rows.map((r) => r.id)
    if (services.length === 0) throw new Error('No services found: create services in the CMS first.')

    // Candidate start times, weighted towards mid-morning and early afternoon.
    const startWeight = (m) => (m >= 600 && m < 690 ? 3 : m >= 810 && m < 930 ? 3 : 1)
    const fits = (start, duration) =>
      start >= open && start + duration <= close && !(start < lunchEnd && start + duration > lunchStart)
    const startsFor = (duration) => {
      const list = []
      for (let m = open; m < close; m += interval) if (fits(m, duration)) for (let w = 0; w < startWeight(m); w++) list.push(m)
      return list
    }

    // Busier towards the end of the week and slowly growing through the month.
    const baseByWeekday = { 1: 4, 2: 5, 3: 5, 4: 6, 5: 7, 6: 6 } // Sunday closed
    const rows = []
    let bookingSeq = 0
    const nowMs = nowManila.getTime()

    for (let d = 1; d <= daysInMonth; d++) {
      const dow = dayOfWeek(year, monthNum, d)
      if (!baseByWeekday[dow]) continue
      const dateStr = `${year}-${pad(monthNum)}-${pad(d)}`
      const trend = 0.9 + (d / daysInMonth) * 0.25
      const target = Math.max(2, Math.round(baseByWeekday[dow] * trend) + between(-1, 1))

      // Same rule as createBookingAction: a booking is refused once the number of active bookings
      // overlapping its window reaches the capacity.
      const booked = [] // active [start, end) intervals already placed today
      const overlapping = (start, duration) => booked.filter((b) => start < b.end && b.start < start + duration).length

      let placed = 0
      let guard = 0
      while (placed < target && guard++ < 200) {
        const service = pick(services)
        const start = pick(startsFor(service.duration))
        const startMs = new Date(stamp(dateStr, start)).getTime()
        const endMs = startMs + service.duration * 60_000

        // Status follows the calendar: past visits were mostly completed, future ones are booked.
        const r = rand()
        const status =
          endMs < nowMs
            ? r < 0.82 ? 'completed' : r < 0.94 ? 'cancelled' : 'confirmed'
            : r < 0.65 ? 'confirmed' : r < 0.95 ? 'pending' : 'cancelled'
        const active = status !== 'cancelled' // cancelled bookings free their slot, as in the app

        const patient = pickPatient()
        const withGuest = active && chance(0.12)
        const guestService = withGuest ? pick(services) : null
        const guestFits = withGuest ? fits(start, guestService.duration) : true
        if (!guestFits) continue

        if (active) {
          // Members of one booking overlap each other, so a guest counts against the primary too.
          const partner = withGuest ? 1 : 0
          if (overlapping(start, service.duration) + partner >= capacity) continue
          if (withGuest && overlapping(start, guestService.duration) + 1 >= capacity) continue
          booked.push({ start, end: start + service.duration })
          if (withGuest) booked.push({ start, end: start + guestService.duration })
        }

        const group = `${marker}-${String(++bookingSeq).padStart(4, '0')}`
        // Booked between a few hours and two weeks ahead, never in the future.
        const createdMs = Math.min(startMs - between(2, 14 * 24) * 3600_000, nowMs - between(1, 90) * 60_000)
        const done = status === 'completed'
        const build = (person, svc, isGuest) => ({
          first_name: person.first,
          surname: person.last,
          email: person.email,
          phone: person.phone,
          service_id: svc.id,
          appointment_date: stamp(dateStr, start),
          end_date_time: stamp(dateStr, start + svc.duration),
          status,
          specialist_notes: done && chance(0.35) ? pick(NOTES) : null,
          booking_group_id: group,
          is_guest: isGuest,
          confirmation_sent: status === 'confirmed' || done,
          reminder24: done,
          reminder2: done,
          specialist_id: specialists.length && chance(done ? 0.9 : 0.5) ? pick(specialists) : null,
          created_at: new Date(createdMs).toISOString(),
          updated_at: new Date(done ? endMs : createdMs).toISOString(),
          price: svc.price,
        })
        rows.push(build(patient, service, false))
        if (withGuest) {
          const guest = { ...pickPatient(), email: patient.email, phone: patient.phone }
          rows.push(build(guest, guestService, true))
        }
        placed++
      }
    }

    // --- report ---------------------------------------------------------------------------------
    const byStatus = rows.reduce((acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc), {})
    const revenue = rows.filter((r) => r.status === 'completed').reduce((sum, r) => sum + r.price, 0)
    console.log(`Month ${month}: ${rows.length} appointments over ${new Set(rows.map((r) => r.appointment_date.slice(0, 10))).size} days`)
    console.log('By status:', byStatus)
    console.log(`Completed revenue: PHP ${revenue.toLocaleString()}  |  guests: ${rows.filter((r) => r.is_guest).length}  |  marker: ${marker}-*`)

    if (DRY_RUN) return console.log('\n--dry-run: nothing written.')

    await client.query('begin')
    const existing = (await client.query('select count(*)::int n from appointments where booking_group_id like $1', [`${marker}-%`])).rows[0].n
    if (existing > 0 && !REPLACE) {
      await client.query('rollback')
      return console.log(`\nAborted: ${existing} seeded rows already exist for ${month}. Re-run with --replace to swap them.`)
    }
    if (existing > 0) {
      await client.query('delete from appointments where booking_group_id like $1', [`${marker}-%`])
      console.log(`Removed ${existing} previously seeded rows.`)
    }

    for (const r of rows) {
      await client.query(
        `insert into appointments
           (first_name, surname, email, phone, service_id, appointment_date, end_date_time, status,
            specialist_notes, booking_group_id, is_guest, email_status_confirmation_sent,
            email_status_reminder24h_sent, email_status_reminder2h_sent, specialist_id, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8::enum_appointments_status,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          r.first_name, r.surname, r.email, r.phone, r.service_id, r.appointment_date, r.end_date_time, r.status,
          r.specialist_notes, r.booking_group_id, r.is_guest, r.confirmation_sent, r.reminder24, r.reminder2,
          r.specialist_id, r.created_at, r.updated_at,
        ],
      )
    }
    await client.query('commit')
    console.log(`\nInserted ${rows.length} appointments.`)
  } catch (err) {
    await client.query('rollback').catch(() => {})
    console.error('Failed, nothing was written:', err.message)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
