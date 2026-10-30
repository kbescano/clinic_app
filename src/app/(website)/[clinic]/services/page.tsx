import { redirect } from 'next/navigation'
import { getPublicServices } from '@/lib/publicServices'
import { requireTenant } from '@/lib/tenants'
import Services from '../../components/Services'
import SiteFooter from '../../components/SiteFooter'

export default async function Page({ params }: { params: Promise<{ clinic: string }> }) {
  const tenant = await requireTenant((await params).clinic)
  // The dental design lists its treatments on the homepage.
  if (tenant.slug === 'dental') redirect('/dental#treatments')
  const services = await getPublicServices(tenant.id)

  return (
    <>
      <div className="mt-20 md:mt-24">
        <Services services={services} heading="h1" />
      </div>
      <SiteFooter tenant={tenant} />
    </>
  )
}
