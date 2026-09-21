import { getStoredPatientProfile } from './actions'
import PatientProfileClient from './PatientProfileClient'

export const dynamic = 'force-dynamic'

export default async function PatientProfilePage() {
  // Server-side check: No flicker, no delay
  const initialData = await getStoredPatientProfile()

  return <PatientProfileClient initialData={initialData} />
}
