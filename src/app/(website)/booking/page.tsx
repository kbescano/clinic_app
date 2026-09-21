import { getPayload } from 'payload'
import config from '@/payload.config'
import BookingForm from './BookingForm'

export const dynamic = 'force-dynamic'

// Next.js 15: searchParams is a Promise
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const payload = await getPayload({ config })
  const params = await searchParams // Await params on the server

  const servicesData = await payload.find({
    collection: 'services',
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
    <div className="min-h-screen bg-white dark:bg-[#050505]">
      <div className="container mx-auto">
        {/* Pass initialData directly as a prop */}
        <BookingForm services={servicesData.docs} initialData={initialData} />
      </div>
    </div>
  )
}
