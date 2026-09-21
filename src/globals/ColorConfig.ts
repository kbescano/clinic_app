import { GlobalConfig } from 'payload'
import { revalidateGlobal } from '@/hooks/revalidationPage'

export const ColorConfig: GlobalConfig = {
  slug: 'color-config',
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateGlobal],
  },
  fields: [
    {
      name: 'primaryColor',
      type: 'text',
      label: 'Primary Color (Hex)',
      required: true,
    },
    {
      name: 'secondaryColor',
      type: 'text',
      label: 'Secondary Color (Hex)',
      required: true,
    },
  ],
}
