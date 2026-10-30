import { getStoredPatientProfile } from './actions'
import PatientProfileClient from './PatientProfileClient'

export const dynamic = 'force-dynamic'

export default async function PatientProfilePage({ params }: { params: Promise<{ clinic: string }> }) {
  // Server-side check: No flicker, no delay
  const initialData = await getStoredPatientProfile((await params).clinic)

  return <PatientProfileClient initialData={initialData} />
}
