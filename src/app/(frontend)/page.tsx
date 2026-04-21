import { Suspense } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import Services from './components/Services'
import SpecialistSection from './components/SpecialistSection'
import BookNowButton from './components/BookNowButton'
import HeroVideo from './components/Hero'
import ContactTrigger from './components/ContactTrigger'
import { ContactProvider } from './components/ContactContext'

export default async function HomePage() {
  const payload = await getPayload({ config })
  const specialistsData = await payload.find({
    collection: 'specialists',
  })

  // Cast the global data to the format the provider expects
  const contactData = (await payload.findGlobal({ slug: 'contact-config' })) as {
    email: string
    address: string
    phoneNumber: string
    officeHours: string
  }
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  return (
    <main className="relative bg-white dark:bg-black w-full overflow-x-hidden min-h-screen">
      {/* GLOBAL ACTIONS */}
      <BookNowButton />
      <ContactProvider contactData={contactData}>
        <ContactTrigger contactData={contactData} />
      </ContactProvider>
      <HeroVideo />
      <div className="space-y-0">
        <Suspense fallback={<SectionSkeleton items={3} />}>
          <Services />
        </Suspense>

        <Suspense fallback={<SectionSkeleton items={2} dark />}>
          <div className="bg-zinc-50 dark:bg-zinc-950">
            <SpecialistSection specialists={specialistsData.docs} serverUrl={serverUrl} />
          </div>
        </Suspense>
      </div>
    </main>
  )
}

function SectionSkeleton({ items = 3, dark = false }: { items?: number; dark?: boolean }) {
  return (
    <div
      className={`py-20 px-4 md:px-8 ${dark ? 'bg-zinc-50 dark:bg-zinc-950' : 'bg-white dark:bg-black'}`}
    >
      <div className="max-w-5xl mx-auto">
        <div className="w-32 h-3 bg-zinc-100 dark:bg-zinc-900 rounded-full animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: items }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-[2rem] animate-pulse border border-zinc-100 dark:border-zinc-800/50"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
