import { revalidateGlobal } from '@/hooks/revalidationPage'
import { GlobalConfig } from 'payload'

export const HeaderConfig: GlobalConfig = {
  slug: 'header-config',
  access: {
    read: () => true, // Anyone can see the clinic configuration
  },
  hooks: {
    afterChange: [revalidateGlobal], // Use the global version here
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media', // Ensure this matches your media collection slug
      label: 'Clinic Logo',
      required: false,
      admin: {
        description: 'Upload the clinical brand mark (Recommended: Transparent PNG or SVG)',
      },
    },
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
