import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function PATCH(
  request: Request,
  // UPDATE THIS LINE: Strictly type params as a Promise
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { status } = body

    // Safely await the Promise
    const resolvedParams = await params
    const appointmentId = resolvedParams.id

    // 1. Update the database
    await payload.update({
      collection: 'appointments',
      id: appointmentId,
      data: { status },
    })

    // 2. PURGE THE CACHES
    revalidatePath('/admin/management')
    revalidatePath('/admin/analytics')
    revalidatePath('/booking')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update appointment status:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
