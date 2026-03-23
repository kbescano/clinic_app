import { revalidateGlobal } from '@/hooks/revalidationPage'
import { GlobalConfig } from 'payload'

export const HeaderConfig: GlobalConfig = {
  slug: 'header-config',
  access: {
    read: () => true, // Anyone can see the clinic name
  },
  hooks: {
    afterChange: [revalidateGlobal], // Use the global version here
  },
  fields: [
    {
      name: 'topLabel',
      type: 'text',
      label: 'Top Label (e.g., Curated Care)',
      defaultValue: 'Curated Care',
      required: true,
    },
    {
      name: 'clinicName',
      type: 'text',
      label: 'Clinic Name',
      defaultValue: 'Skin Radiance Clinic',
      required: true,
    },
  ],
}
