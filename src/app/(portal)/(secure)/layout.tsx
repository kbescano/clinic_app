import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { requireStaff } from '@/lib/auth'
import { NotificationProvider } from '../components/NotificationContext'
import NotificationModal from '../components/NotificationModal'
import PortalHeader from '../components/PortalHeader'
import PortalMenu from '../components/PortalMenu'

/**
 * Everything under (secure) is staff-only. Login lives outside this group so it can render
 * without the header. Pages and actions still check the session themselves: layouts are not
 * re-run on client-side navigation.
 */
export default async function SecurePortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff()

  const payload = await getPayload({ config })
  const headerData = await payload.findGlobal({ slug: 'header-config' })

  return (
    <NotificationProvider>
      <PortalHeader clinicName={headerData?.clinicName} email={user.email} />
      <main className="min-h-screen pb-20 lg:pb-0 dark:bg-black">{children}</main>

      <PortalMenu />
      <NotificationModal />
    </NotificationProvider>
  )
}
