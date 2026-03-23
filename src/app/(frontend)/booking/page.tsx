import { getPayload } from 'payload'
import config from '@/payload.config'
import BookingForm from './BookingForm'

export default async function Page() {
  const payload = await getPayload({ config })

  // Only fetch services since you want to skip Specialist selection
  const servicesData = await payload.find({
    collection: 'services',
    sort: 'title',
  })

  return (
    <div className="min-h-screen bg-white dark:bg-black py-10">
      <div className="container mx-auto">
        {/* Just pass services. Make sure BookingForm is updated to match! */}
        <BookingForm services={servicesData.docs} />
      </div>
    </div>
  )
}
