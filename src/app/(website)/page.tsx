import { getTenants } from '@/lib/tenants'
import Chooser from './components/Chooser'

/** The landing page: choose a clinic. Its names come from the Clinics collection. */
export default async function ChooserPage() {
  const tenants = await getTenants()
  return <Chooser names={Object.fromEntries(tenants.map((t) => [t.slug, t.name]))} />
}
