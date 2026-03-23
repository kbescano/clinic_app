import { GlobalConfig } from 'payload'

export const ColorConfig: GlobalConfig = {
  slug: 'color-config',
  access: {
    read: () => true,
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
