// One-off move from a single clinic to two clinics (tenants): skin and dental.
//
//   node scripts/setup-tenants.mjs             apply
//   node scripts/setup-tenants.mjs --dry-run   show what would change, write nothing
//
// Run it after the tenant columns exist (start the app once in development so Payload adds them).
// Safe to run again: every step only fills in what is missing.
//
//   1. Creates the "skin" clinic from the current header, contact and booking globals, and an
//      "dental" clinic with its own settings.
//   2. Assigns every existing service, specialist and appointment to the skin clinic.
//   3. Makes every existing staff account a super admin (they ran the single clinic, so they keep
//      access to everything) with skin as their home clinic.
//   4. Gives the dental clinic its services and dentists, if it has none yet.
import 'dotenv/config'
import pg from 'pg'

const DRY_RUN = process.argv.includes('--dry-run')

const DENTAL_SERVICES = [
  {
    title: 'Whitening',
    duration: '90',
    price: 12000,
    description: 'In-chair whitening that lifts coffee and tea stains, several shades brighter in a single visit.',
  },
  {
    title: 'Check-up & cleaning',
    duration: '60',
    price: 1500,
    description: 'A full exam, a 3D scan and a gentle polish. Small problems are caught while they are still small.',
  },
  {
    title: 'Clear aligners',
    duration: '30',
    price: 1500,
    description: 'Discreet straightening, previewed in 3D. This first visit is the consultation and scan.',
  },
  {
    title: 'Implants',
    duration: '60',
    price: 2500,
    description: 'A permanent, natural-looking replacement tooth. This first visit is the consultation and planning.',
  },
  {
    title: 'Veneers',
    duration: '90',
    price: 18000,
    description: 'Porcelain shells that reshape and brighten. Priced per tooth.',
  },
  {
    title: 'Emergency care',
    duration: '30',
    price: 2000,
    description: 'Same-day help when something hurts: a cracked tooth, a lost filling or sudden pain.',
  },
]

const DENTISTS = [
  { name: 'Dr. Mara Villanueva', specialization: 'General & cosmetic dentistry' },
  { name: 'Dr. Luis Navarro', specialization: 'Orthodontics & clear aligners' },
  { name: 'Dr. Bea Castillo', specialization: 'Implants & oral surgery' },
]

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
  await client.connect()
  const q = async (sql, params) => (await client.query(sql, params)).rows
  const log = (...args) => console.log(DRY_RUN ? '[dry-run]' : '', ...args)

  try {
    const hasColumns = (await q("select 1 from information_schema.columns where table_name = 'appointments' and column_name = 'tenant_id'")).length
    if (!hasColumns) throw new Error('The tenant columns do not exist yet. Start the app once in development so Payload adds them.')

    await client.query('begin')

    // 1. The two clinics.
    const header = (await q('select * from header_config limit 1'))[0] ?? {}
    const contact = (await q('select * from contact_config limit 1'))[0] ?? {}
    const booking = (await q('select * from booking_config limit 1'))[0] ?? {}
    const clinics = [
      {
        slug: 'skin',
        name: header.clinic_name || 'Skin Clinic',
        top_label: header.top_label ?? null,
        logo_id: header.logo_id ?? null,
        contact_address: contact.address || 'Metro Manila, Philippines',
        contact_phone_number: contact.phone_number || '',
        contact_email: contact.email || '',
        contact_office_hours: contact.office_hours || 'Mon to Sat, 9:00 AM to 5:00 PM',
        booking_opening_time: booking.opening_time || '09:00',
        booking_closing_time: booking.closing_time || '17:00',
        booking_slot_interval: booking.slot_interval || '30',
        booking_specialist_capacity: Number(booking.specialist_capacity) || 1,
        booking_lunch_start: booking.lunch_break_start || '12:00',
        booking_lunch_end: booking.lunch_break_end || '13:00',
      },
      {
        slug: 'dental',
        name: 'Ivory Dental Studio',
        top_label: 'Modern dentistry, gently done',
        logo_id: null,
        contact_address: '2F Ivory House, 32nd Street\nBonifacio Global City, Taguig',
        contact_phone_number: '+63 917 000 5678',
        contact_email: 'hello@ivory-dental.example',
        contact_office_hours: 'Mon to Sat, 9:00 AM to 5:00 PM',
        booking_opening_time: '09:00',
        booking_closing_time: '17:00',
        booking_slot_interval: '30',
        booking_specialist_capacity: 3,
        booking_lunch_start: '12:00',
        booking_lunch_end: '13:00',
      },
    ]
    const ids = {}
    for (const clinic of clinics) {
      const existing = (await q('select id from tenants where slug = $1', [clinic.slug]))[0]
      if (existing) {
        ids[clinic.slug] = existing.id
        log(`Clinic "${clinic.slug}" already exists (id ${existing.id}).`)
        continue
      }
      const cols = Object.keys(clinic)
      const [row] = await q(
        `insert into tenants (${cols.join(', ')}) values (${cols.map((c, i) => `$${i + 1}${c === 'slug' ? '::enum_tenants_slug' : c === 'booking_slot_interval' ? '::enum_tenants_booking_slot_interval' : ''}`).join(', ')}) returning id`,
        cols.map((c) => clinic[c]),
      )
      ids[clinic.slug] = row.id
      log(`Created clinic "${clinic.slug}" (${clinic.name}), id ${row.id}.`)
    }

    // 2. Everything that exists today belongs to the skin clinic.
    for (const table of ['services', 'specialists', 'appointments']) {
      const { rowCount } = await client.query(`update ${table} set tenant_id = $1 where tenant_id is null`, [ids.skin])
      log(`${table}: ${rowCount} rows assigned to skin.`)
    }

    // 3. Existing staff keep access to everything.
    const promoted = await q(
      'update users set is_super_admin = true, tenant_id = coalesce(tenant_id, $1) where tenant_id is null returning email',
      [ids.skin],
    )
    log(`Super admins: ${promoted.map((u) => u.email).join(', ') || 'none changed'}.`)

    // 4. The dental clinic's own services and dentists.
    const dentalServices = (await q('select count(*)::int n from services where tenant_id = $1', [ids.dental]))[0].n
    if (dentalServices === 0) {
      for (const s of DENTAL_SERVICES) {
        await q('insert into services (title, description, price, duration, tenant_id) values ($1, $2, $3, $4::enum_services_duration, $5)', [
          s.title,
          s.description,
          s.price,
          s.duration,
          ids.dental,
        ])
      }
      log(`Added ${DENTAL_SERVICES.length} dental services.`)
    } else log(`Dental already has ${dentalServices} services.`)

    const dentalSpecialists = (await q('select count(*)::int n from specialists where tenant_id = $1', [ids.dental]))[0].n
    if (dentalSpecialists === 0) {
      for (const d of DENTISTS) {
        await q('insert into specialists (name, specialization, tenant_id) values ($1, $2, $3)', [d.name, d.specialization, ids.dental])
      }
      log(`Added ${DENTISTS.length} dentists.`)
    } else log(`Dental already has ${dentalSpecialists} specialists.`)

    if (DRY_RUN) {
      await client.query('rollback')
      console.log('\n--dry-run: rolled back, nothing written.')
    } else {
      await client.query('commit')
      console.log('\nDone.')
    }
  } catch (err) {
    await client.query('rollback').catch(() => {})
    console.error('Failed, nothing was written:', err.message)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
