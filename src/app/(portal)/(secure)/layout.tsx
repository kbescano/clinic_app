import React from 'react'
import { requirePortal } from '@/lib/auth'
import { getTenants } from '@/lib/tenants'
import { NotificationProvider } from '../components/NotificationContext'
import NotificationModal from '../components/NotificationModal'
import PortalHeader from '../components/PortalHeader'
import { PortalDemoProvider } from '../components/PortalDemo'

/**
 * Everything under (secure) is staff-only. Login lives outside this group so it can render
 * without the header. Pages and actions still check the session themselves: layouts are not
 * re-run on client-side navigation.
 */
export default async function SecurePortalLayout({ children }: { children: React.ReactNode }) {
  const { email, tenant, canSwitchClinic, demo } = await requirePortal()
  // Super admins can switch clinics; everyone else only ever sees their own.
  const clinics = canSwitchClinic ? (await getTenants()).map((t) => ({ slug: t.slug, name: t.name })) : []

  return (
    <PortalDemoProvider demo={demo}>
    <NotificationProvider>
      <PortalHeader clinicName={tenant.name} clinicSlug={tenant.slug} clinics={clinics} email={email} demo={demo} />
      {/* Pages pad for the header's top row; this adds its page links row (and the demo strip). */}
      <main className={`min-h-screen dark:bg-black ${demo ? 'pt-20' : 'pt-12'}`}>{children}</main>

      <NotificationModal />
    </NotificationProvider>
    </PortalDemoProvider>
  )
}
