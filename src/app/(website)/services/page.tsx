import { getPublicServices } from '@/lib/publicServices'
import Services from '../components/Services'
import SiteFooter from '../components/SiteFooter'

export default async function Page() {
  const services = await getPublicServices()

  return (
    <>
      <div className="mt-20 md:mt-24">
        <Services services={services} heading="h1" />
      </div>
      <SiteFooter />
    </>
  )
}
