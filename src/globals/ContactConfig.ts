import { revalidateGlobal } from '@/hooks/revalidationPage'
import { GlobalConfig } from 'payload'

export const ContactConfig: GlobalConfig = {
  slug: 'contact-config',
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateGlobal], // Use the global version here
  },
  fields: [
    {
      name: 'address',
      type: 'text',
      required: true,
      defaultValue: 'San Pedro, Laguna, Philippines',
    },
    {
      name: 'phoneNumber',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'text',
      required: true,
    },
    {
      name: 'officeHours',
      type: 'text',
      required: true,
    },
  ],
}
