import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// --- 1. DEFINE UPLOAD INTERFACES ---

interface IncomingAppointment {
  firstName: string
  surname: string
  email: string
  phone: string
  appointmentDate: string
  service: string // The title from the CSV/JSON
  status?: 'confirmed' | 'cancelled' | 'pending' | 'completed'
}

interface ServiceDoc {
  id: string | number
  title: string
}

export async function POST(req: Request) {
  const payload = await getPayload({ config })

  // Cast the incoming JSON array
  const data: IncomingAppointment[] = await req.json()

  try {
    // 1. Fetch all services currently in your database
    const servicesRes = await payload.find({
      collection: 'services',
      limit: 100,
    })

    const serviceDocs = servicesRes.docs as unknown as ServiceDoc[]

    // 2. Create a Map of "Name" -> "ID"
    // Typed as Record<string, string | number> to avoid 'any'
    const serviceMap = serviceDocs.reduce((acc: Record<string, string | number>, s) => {
      acc[s.title.trim().toLowerCase()] = s.id
      return acc
    }, {})

    // 3. Process the upload
    const uploadPromises = data.map((item) => {
      const cleanName = item.service.trim().toLowerCase()
      const sId = serviceMap[cleanName]

      if (!sId) {
        throw new Error(
          `Service "${item.service}" not found. Please create it in the Services collection first.`,
        )
      }

      return payload.create({
        collection: 'appointments',
        data: {
          firstName: item.firstName,
          surname: item.surname,
          email: item.email,
          phone: item.phone,
          appointmentDate: item.appointmentDate,
          status: item.status || 'confirmed',
          service: sId as number, // Payload expects specific relation types
        },
        overrideAccess: true,
      })
    })

    await Promise.all(uploadPromises)

    return NextResponse.json({ success: true, count: data.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown upload error'
    console.error('Mass Upload Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
