import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Media, Tenant } from '@/payload-types'
import { getPublicServices } from '@/lib/publicServices'
import DentalHero from './DentalHero'
import DentalIntro from './DentalIntro'
import SmileSequence from './SmileSequence'
import DentalTreatments from './DentalTreatments'
import DentalCalm from './DentalCalm'
import DentalTeam from './DentalTeam'
import DentalReviews from './DentalReviews'
import { DentalFooter, DentalVisit } from './DentalVisit'
import { dentistExtras, treatmentVisual, type Dentist, type Treatment } from './data'

const php = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`

/**
 * The dental clinic's homepage: warm paper, ink and one hot orange, with a pinned 3D smile in the
 * middle. Treatments and the team are this clinic's own services and specialists from the CMS.
 */
export default async function DentalHome({ tenant }: { tenant: Tenant }) {
  const payload = await getPayload({ config })
  const [services, specialists] = await Promise.all([
    getPublicServices(tenant.id),
    payload.find({ collection: 'specialists', where: { tenant: { equals: tenant.id } }, sort: 'id', depth: 1, limit: 20 }),
  ])

  const treatments: Treatment[] = services.map((s, i) => ({
    id: String(s.id),
    title: s.title,
    blurb: s.description,
    duration: `${s.duration} min`,
    price: php(s.price),
    ...treatmentVisual(s.title, i, s.images[0]?.url),
  }))

  const team: Dentist[] = specialists.docs.map((d, i) => {
    const image = d.image as Media | number | null | undefined
    return {
      id: String(d.id),
      name: d.name,
      role: d.specialization,
      ...dentistExtras(d.name, i, typeof image === 'object' && image?.url ? image.url : undefined),
    }
  })

  return (
    <>
      <main>
        <DentalHero />
        <DentalIntro />
        <SmileSequence />
        <div className="pt-24 md:pt-40">
          <DentalTreatments treatments={treatments} />
        </div>
        <DentalCalm />
        <DentalTeam team={team} />
        <DentalReviews />
        <DentalVisit />
      </main>
      <DentalFooter />
    </>
  )
}
