import { getStoredPatientProfile } from '../profile/actions'
import AppointmentClient from './AppointmentClient'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const initialData = await getStoredPatientProfile()
  return (
    <div>
      <AppointmentClient initialData={initialData} />
    </div>
  )
}
