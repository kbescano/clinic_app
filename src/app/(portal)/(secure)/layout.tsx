import React from 'react'
import { requirePortal } from '@/lib/auth'
import { getTenants } from '@/lib/tenants'
import { NotificationProvider } from '../components/NotificationContext'
import NotificationModal from '../components/NotificationModal'
import PortalHeader from '../components/PortalHeader'
import PortalMenu from '../components/PortalMenu'
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
      {/* The demo strip makes the fixed header taller. */}
      <main className={`min-h-screen pb-20 lg:pb-0 dark:bg-black ${demo ? 'pt-8' : ''}`}>{children}</main>

      <PortalMenu />
      <NotificationModal />
    </NotificationProvider>
    </PortalDemoProvider>
  )
}
