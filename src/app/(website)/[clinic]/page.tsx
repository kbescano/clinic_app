import { requireTenant } from '@/lib/tenants'
import SkinHome from '../components/SkinHome'
import DentalHome from '../components/dental/DentalHome'

/** Each clinic's homepage, in its own design. */
export default async function ClinicHomePage({ params }: { params: Promise<{ clinic: string }> }) {
  const tenant = await requireTenant((await params).clinic)
  return tenant.slug === 'dental' ? <DentalHome tenant={tenant} /> : <SkinHome tenant={tenant} />
}
