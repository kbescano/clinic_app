import { getPayload } from 'payload'
import config from '@/payload.config'
import { getPublicServices } from '@/lib/publicServices'
import Services from './components/Services'
import EquipmentShowcase from './components/EquipmentShowcase'
import SpecialistSection from './components/SpecialistSection'
import BookNowButton from './components/BookNowButton'
import HeroVideo from './components/Hero'
import ContactTrigger from './components/ContactTrigger'
import { ContactProvider } from './components/ContactContext'
import SiteFooter from './components/SiteFooter'

export default async function HomePage() {
  const payload = await getPayload({ config })
  const [specialistsData, contactData, services] = await Promise.all([
    payload.find({ collection: 'specialists' }),
    // Cast the global data to the format the provider expects
    payload.findGlobal({ slug: 'contact-config' }) as Promise<{
      email: string
      address: string
      phoneNumber: string
      officeHours: string
    }>,
    getPublicServices(),
  ])

  return (
    <div className="relative min-h-screen w-full">
      {/* GLOBAL ACTIONS */}
      <BookNowButton />
      <ContactProvider contactData={contactData}>
        <ContactTrigger contactData={contactData} />
      </ContactProvider>

      {/* The hero is pinned; the page below slides over it like a curtain. */}
      <div className="sticky top-0 z-0 h-[100dvh] w-full overflow-hidden">
        <HeroVideo />
      </div>

      <div className="relative z-10 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.5)] dark:bg-[#050505]">
        <EquipmentShowcase />
        <Services services={services} />

        <div className="bg-zinc-50 dark:bg-[#080808]">
          <SpecialistSection specialists={specialistsData.docs} />
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}
