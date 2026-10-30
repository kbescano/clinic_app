import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Tenant } from '@/payload-types'
import { getPublicServices } from '@/lib/publicServices'
import Services from './Services'
import EquipmentShowcase from './EquipmentShowcase'
import SpecialistSection from './SpecialistSection'
import BookNowButton from './BookNowButton'
import HeroVideo from './Hero'
import ContactTrigger from './ContactTrigger'
import { ContactProvider } from './ContactContext'
import SiteFooter from './SiteFooter'

/** The skin clinic's homepage: bold black and white, video hero, pinned 3D equipment. */
export default async function SkinHome({ tenant }: { tenant: Tenant }) {
  const payload = await getPayload({ config })
  const [specialistsData, services] = await Promise.all([
    payload.find({ collection: 'specialists', where: { tenant: { equals: tenant.id } }, sort: 'id' }),
    getPublicServices(tenant.id),
  ])
  const contactData = tenant.contact

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

        <SiteFooter tenant={tenant} />
      </div>
    </div>
  )
}
