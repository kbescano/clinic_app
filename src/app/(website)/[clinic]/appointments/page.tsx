import { getStoredPatientProfile } from '../profile/actions'
import AppointmentClient from './AppointmentClient'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ clinic: string }> }) {
  const initialData = await getStoredPatientProfile((await params).clinic)
  return (
    <div>
      <AppointmentClient initialData={initialData} />
    </div>
  )
}
