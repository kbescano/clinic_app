import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const payload = await getPayload({ config })
  const data = await req.json() // Your JSON array from the frontend

  try {
    // 1. Fetch all services currently in your database
    const servicesRes = await payload.find({
      collection: 'services',
      limit: 100,
    })

    // 2. Create a Map of "Name" -> "ID"
    // This turns "Anti-Aging Treatment" into something like "65f123abc..."
    const serviceMap = servicesRes.docs.reduce((acc: any, s: any) => {
      acc[s.title.trim().toLowerCase()] = s.id
      return acc
    }, {})

    // 3. Process the upload
    const uploadPromises = data.map((item: any) => {
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
          service: sId, // <--- This passes the ID to the database
        },
        overrideAccess: true, // Bypasses permission checks for this admin tool
      })
    })

    await Promise.all(uploadPromises)

    return NextResponse.json({ success: true, count: data.length })
  } catch (err: any) {
    console.error('Mass Upload Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
