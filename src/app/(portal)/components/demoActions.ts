'use server'

import { redirect } from 'next/navigation'
import { isClinicSlug } from '@/lib/clinics'
import { getTenant } from '@/lib/tenants'
import { endDemoSession, startDemoSession } from '@/lib/portalDemo'

/** Opens one clinic's staff portal in demo mode: sample bookings, view only, no account needed. */
export async function startPortalDemo(clinic: string) {
  if (!isClinicSlug(clinic) || !(await getTenant(clinic))) throw new Error('Unknown clinic')
  await startDemoSession(clinic)
  redirect('/dashboard')
}

export async function exitPortalDemo() {
  await endDemoSession()
  redirect('/login')
}
