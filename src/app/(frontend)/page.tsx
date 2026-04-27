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
    <main className="relative w-full min-h-screen selection:bg-zinc-100">
      {/* GLOBAL ACTIONS */}
      <BookNowButton />
      <ContactProvider contactData={contactData}>
        <ContactTrigger contactData={contactData} />
      </ContactProvider>

      {/* HERO CONTAINER
        Sticky positioning locks the video in place as the user scrolls down.
        The -z-0 keeps it structurally behind the content blocks.
      */}
      <div className="sticky top-0 w-full h-[100dvh] overflow-hidden z-0">
        <HeroVideo />
      </div>

      {/* SCROLLING CONTENT CONTAINER
        Relative positioning with z-10 allows this entire block to glide 
        over the pinned Hero video, creating the "curtain cover" effect.
      */}
      <div className="relative z-10 bg-white dark:bg-[#050505] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <Services />

        <div className="bg-zinc-50 dark:bg-[#080808]">
          <SpecialistSection specialists={specialistsData.docs} serverUrl={serverUrl} />
        </div>
      </div>
    </main>
  )
}
