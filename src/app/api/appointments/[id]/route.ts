import { getPayload } from 'payload'
import config from '@/payload.config'
import { getStaffUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

const VALID_STATUSES = ['confirmed', 'pending', 'completed', 'cancelled'] as const
type Status = (typeof VALID_STATUSES)[number]

export async function PATCH(
  request: Request,
  // UPDATE THIS LINE: Strictly type params as a Promise
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getStaffUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { status, specialistNotes } = body

    // Two staff edits share this endpoint: the status buttons and the specialist note box.
    const data: { status?: Status; specialistNotes?: string } = {}
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      data.status = status
    }
    if (specialistNotes !== undefined) {
      if (typeof specialistNotes !== 'string') {
        return NextResponse.json({ error: 'Invalid note' }, { status: 400 })
      }
      data.specialistNotes = specialistNotes
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    // Safely await the Promise
    const resolvedParams = await params
    const appointmentId = resolvedParams.id

    // 1. Update the database
    await payload.update({
      collection: 'appointments',
      id: appointmentId,
      data,
    })

    // 2. PURGE THE CACHES
    revalidatePath('/admin/manager')
    revalidatePath('/admin/analytics')
    revalidatePath('/booking')
    revalidatePath('/medical-history')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update appointment:', error)
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
  }
}
