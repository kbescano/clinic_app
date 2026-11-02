import { NextResponse, type NextRequest } from 'next/server'
import { isClinicSlug } from '@/lib/clinics'
import { startDemoSession } from '@/lib/portalDemo'
import { getTenant } from '@/lib/tenants'

/**
 * A link straight into one clinic's portal demo (/demo/dental, /demo/skin), for emails and the
 * website: same as "Explore the demo" on the sign-in page, without the extra click. A signed-in
 * staff member keeps their own session; theirs always wins over a demo cookie.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ clinic: string }> }) {
  const { clinic } = await params
  if (!isClinicSlug(clinic) || !(await getTenant(clinic))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  await startDemoSession(clinic)
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
