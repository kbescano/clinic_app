import { getPayload } from 'payload'
import config from '@/payload.config'
import { requireTenant } from '@/lib/tenants'
import BookingForm from './BookingForm'

export const dynamic = 'force-dynamic'

// Next.js 15: searchParams is a Promise
export default async function Page({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ clinic: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const payload = await getPayload({ config })
  const tenant = await requireTenant((await routeParams).clinic)
  const params = await searchParams // Await params on the server

  // Only this clinic's treatments can be booked here.
  const servicesData = await payload.find({
    collection: 'services',
    where: { tenant: { equals: tenant.id } },
    sort: 'title',
  })

  // Extract values on the server
  const initialData = {
    email: (params.email as string) || '',
    fn: (params.fn as string) || '',
    sn: (params.sn as string) || '',
    ph: (params.ph as string) || '',
  }

  return (
    <div className={`min-h-screen ${tenant.slug === 'dental' ? 'bg-paper pt-8' : 'bg-white dark:bg-[#050505]'}`}>
      <div className="container mx-auto">
        {/* Pass initialData directly as a prop */}
        <BookingForm services={servicesData.docs} initialData={initialData} />
      </div>
    </div>
  )
}
